"""
Production secrets management for RareSift
Supports multiple secret backends: Environment variables, HashiCorp Vault, AWS Secrets Manager
"""

import os
import json
import logging
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class SecretBackend(ABC):
    """Abstract base class for secret backends"""
    
    @abstractmethod
    def get_secret(self, key: str) -> Optional[str]:
        """Get a single secret value"""
        pass
    
    @abstractmethod
    def get_secrets(self, prefix: str = "") -> Dict[str, str]:
        """Get all secrets with optional prefix"""
        pass

class EnvironmentSecretBackend(SecretBackend):
    """Environment variables secret backend"""
    
    def get_secret(self, key: str) -> Optional[str]:
        return os.getenv(key)
    
    def get_secrets(self, prefix: str = "") -> Dict[str, str]:
        secrets = {}
        for key, value in os.environ.items():
            if prefix and not key.startswith(prefix):
                continue
            secrets[key] = value
        return secrets

class VaultSecretBackend(SecretBackend):
    """HashiCorp Vault secret backend"""
    
    def __init__(self, vault_addr: str, vault_token: str, mount_path: str = "raresift"):
        self.vault_addr = vault_addr.rstrip('/')
        self.vault_token = vault_token
        self.mount_path = mount_path
        self._client = None
        
        try:
            import hvac
            self._client = hvac.Client(
                url=self.vault_addr,
                token=self.vault_token
            )
            if not self._client.is_authenticated():
                raise Exception("Vault authentication failed")
            logger.info(f"Connected to Vault at {vault_addr}")
        except ImportError:
            logger.error("hvac library not installed. Install with: pip install hvac")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to Vault: {e}")
            raise
    
    def get_secret(self, key: str) -> Optional[str]:
        try:
            # Try to get from current environment path
            env = os.getenv('ENVIRONMENT', 'prod')
            secret_path = f"{self.mount_path}/data/{env}"
            
            response = self._client.secrets.kv.v2.read_secret_version(
                path=secret_path
            )
            
            secrets_data = response['data']['data']
            return secrets_data.get(key)
            
        except Exception as e:
            logger.warning(f"Failed to get secret '{key}' from Vault: {e}")
            return None
    
    def get_secrets(self, prefix: str = "") -> Dict[str, str]:
        try:
            env = os.getenv('ENVIRONMENT', 'prod')
            secret_path = f"{self.mount_path}/data/{env}"
            
            response = self._client.secrets.kv.v2.read_secret_version(
                path=secret_path
            )
            
            secrets_data = response['data']['data']
            
            if prefix:
                return {k: v for k, v in secrets_data.items() if k.startswith(prefix)}
            
            return secrets_data
            
        except Exception as e:
            logger.warning(f"Failed to get secrets from Vault: {e}")
            return {}

class AWSSecretBackend(SecretBackend):
    """AWS Secrets Manager backend"""
    
    def __init__(self, region_name: str = "us-west-2"):
        self.region_name = region_name
        self._client = None
        
        try:
            import boto3
            self._client = boto3.client(
                'secretsmanager',
                region_name=region_name
            )
            logger.info(f"Connected to AWS Secrets Manager in {region_name}")
        except ImportError:
            logger.error("boto3 library not installed. Install with: pip install boto3")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to AWS Secrets Manager: {e}")
            raise
    
    def _get_secret_name(self) -> str:
        """Get the secret name based on environment"""
        env = os.getenv('ENVIRONMENT', 'prod')
        return f"raresift/{env}/config"
    
    def get_secret(self, key: str) -> Optional[str]:
        try:
            secret_name = self._get_secret_name()
            
            response = self._client.get_secret_value(SecretId=secret_name)
            secrets_data = json.loads(response['SecretString'])
            
            return secrets_data.get(key)
            
        except Exception as e:
            logger.warning(f"Failed to get secret '{key}' from AWS: {e}")
            return None
    
    def get_secrets(self, prefix: str = "") -> Dict[str, str]:
        try:
            secret_name = self._get_secret_name()
            
            response = self._client.get_secret_value(SecretId=secret_name)
            secrets_data = json.loads(response['SecretString'])
            
            if prefix:
                return {k: v for k, v in secrets_data.items() if k.startswith(prefix)}
            
            return secrets_data
            
        except Exception as e:
            logger.warning(f"Failed to get secrets from AWS: {e}")
            return {}

class SecretManager:
    """Main secret manager with fallback support"""
    
    def __init__(self):
        self.backends = []
        self._setup_backends()
    
    def _setup_backends(self):
        """Setup secret backends in priority order"""
        
        # Try Vault first (most secure for production)
        vault_addr = os.getenv('VAULT_ADDR')
        vault_token = os.getenv('VAULT_TOKEN')
        
        if vault_addr and vault_token:
            try:
                vault_backend = VaultSecretBackend(vault_addr, vault_token)
                self.backends.append(('vault', vault_backend))
                logger.info("Vault backend configured")
            except Exception as e:
                logger.warning(f"Failed to setup Vault backend: {e}")
        
        # Try AWS Secrets Manager
        if os.getenv('AWS_ACCESS_KEY_ID') or os.getenv('AWS_PROFILE'):
            try:
                aws_backend = AWSSecretBackend()
                self.backends.append(('aws', aws_backend))
                logger.info("AWS Secrets Manager backend configured")
            except Exception as e:
                logger.warning(f"Failed to setup AWS backend: {e}")
        
        # Always add environment variables as fallback
        env_backend = EnvironmentSecretBackend()
        self.backends.append(('env', env_backend))
        logger.info("Environment variables backend configured")
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get a secret from the first available backend
        Falls back through backends until found
        """
        for backend_name, backend in self.backends:
            try:
                value = backend.get_secret(key)
                if value is not None:
                    logger.debug(f"Secret '{key}' retrieved from {backend_name}")
                    return value
            except Exception as e:
                logger.warning(f"Error getting secret '{key}' from {backend_name}: {e}")
                continue
        
        logger.warning(f"Secret '{key}' not found in any backend")
        return default
    
    def get_required_secret(self, key: str) -> str:
        """
        Get a required secret, raise exception if not found
        """
        value = self.get_secret(key)
        if value is None:
            raise ValueError(f"Required secret '{key}' not found in any backend")
        return value
    
    def get_secrets(self, prefix: str = "") -> Dict[str, str]:
        """
        Get all secrets with optional prefix
        Merges results from all backends (first backend wins for conflicts)
        """
        all_secrets = {}
        
        # Process backends in reverse order so higher priority backends overwrite
        for backend_name, backend in reversed(self.backends):
            try:
                secrets = backend.get_secrets(prefix)
                all_secrets.update(secrets)
                logger.debug(f"Retrieved {len(secrets)} secrets from {backend_name}")
            except Exception as e:
                logger.warning(f"Error getting secrets from {backend_name}: {e}")
        
        return all_secrets
    
    def health_check(self) -> Dict[str, Any]:
        """
        Check health of all secret backends
        """
        health = {
            'healthy': True,
            'backends': {}
        }
        
        for backend_name, backend in self.backends:
            try:
                # Try to retrieve a test value
                test_result = backend.get_secret('HEALTH_CHECK_TEST')
                health['backends'][backend_name] = {
                    'status': 'healthy',
                    'accessible': True
                }
            except Exception as e:
                health['backends'][backend_name] = {
                    'status': 'unhealthy',
                    'accessible': False,
                    'error': str(e)
                }
                if backend_name != 'env':  # Environment backend failure is not critical
                    health['healthy'] = False
        
        return health

# Global secret manager instance
secret_manager = SecretManager()

# Convenience functions
def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Get a secret value"""
    return secret_manager.get_secret(key, default)

def get_required_secret(key: str) -> str:
    """Get a required secret value"""
    return secret_manager.get_required_secret(key)

def get_secrets(prefix: str = "") -> Dict[str, str]:
    """Get all secrets with optional prefix"""
    return secret_manager.get_secrets(prefix)