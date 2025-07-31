#!/bin/bash

# SSL Certificate Generation Script for RareSift
# Generates self-signed certificates for development and provides Let's Encrypt setup for production

set -e

echo "🔐 RareSift SSL Certificate Generator"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SSL_DIR="./nginx/ssl"
DOMAIN="${DOMAIN:-localhost}"
COUNTRY="${COUNTRY:-US}"
STATE="${STATE:-California}"
CITY="${CITY:-San Francisco}"
ORGANIZATION="${ORGANIZATION:-RareSift}"
ORG_UNIT="${ORG_UNIT:-IT Department}"
EMAIL="${EMAIL:-admin@raresift.com}"

# Create SSL directory
mkdir -p "$SSL_DIR"
cd "$SSL_DIR"

echo -e "${BLUE}📁 SSL certificates will be stored in: $(pwd)${NC}"

# Function to generate self-signed certificate
generate_self_signed() {
    echo -e "${YELLOW}🔑 Generating self-signed SSL certificate for development...${NC}"
    
    # Generate private key
    openssl genrsa -out server.key 2048
    
    # Generate certificate signing request
    openssl req -new -key server.key -out server.csr -subj "/C=$COUNTRY/ST=$STATE/L=$CITY/O=$ORGANIZATION/OU=$ORG_UNIT/CN=$DOMAIN/emailAddress=$EMAIL"
    
    # Generate self-signed certificate
    openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt -extensions v3_req -extfile <(
        echo '[v3_req]'
        echo 'basicConstraints = CA:FALSE'
        echo 'keyUsage = nonRepudiation, digitalSignature, keyEncipherment'
        echo 'subjectAltName = @alt_names'
        echo '[alt_names]'
        echo "DNS.1 = $DOMAIN"
        echo 'DNS.2 = localhost'
        echo 'DNS.3 = *.localhost'
        echo 'IP.1 = 127.0.0.1'
        echo 'IP.2 = ::1'
    )
    
    # Set appropriate permissions
    chmod 600 server.key
    chmod 644 server.crt
    
    echo -e "${GREEN}✅ Self-signed certificate generated successfully${NC}"
    echo -e "${GREEN}   Certificate: server.crt${NC}"
    echo -e "${GREEN}   Private Key: server.key${NC}"
    echo -e "${GREEN}   Valid for: 365 days${NC}"
    echo -e "${GREEN}   Domain: $DOMAIN${NC}"
}

# Function to set up Let's Encrypt
setup_letsencrypt() {
    echo -e "${YELLOW}🌐 Setting up Let's Encrypt certificates for production...${NC}"
    
    if [[ "$DOMAIN" == "localhost" ]]; then
        echo -e "${RED}❌ Cannot use Let's Encrypt with localhost${NC}"
        echo -e "${BLUE}💡 Please set DOMAIN environment variable to your actual domain${NC}"
        return 1
    fi
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        echo -e "${YELLOW}📦 Installing certbot...${NC}"
        
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command -v yum &> /dev/null; then
            sudo yum install -y certbot python3-certbot-nginx
        elif command -v brew &> /dev/null; then
            brew install certbot
        else
            echo -e "${RED}❌ Cannot install certbot automatically${NC}"
            echo -e "${BLUE}💡 Please install certbot manually${NC}"
            return 1
        fi
    fi
    
    echo -e "${BLUE}🔧 Generating Let's Encrypt certificate for $DOMAIN...${NC}"
    echo -e "${BLUE}📧 Email: $EMAIL${NC}"
    
    # Generate certificate using standalone mode
    sudo certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --pre-hook "docker-compose -f docker-compose.production.yml stop nginx" \
        --post-hook "docker-compose -f docker-compose.production.yml start nginx"
    
    # Copy certificates to nginx directory
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" server.crt
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" server.key
    sudo chown $USER:$USER server.crt server.key
    chmod 644 server.crt
    chmod 600 server.key
    
    echo -e "${GREEN}✅ Let's Encrypt certificate generated successfully${NC}"
    
    # Set up auto-renewal
    echo -e "${BLUE}⏰ Setting up automatic renewal...${NC}"
    
    # Create renewal script
    cat > ../lets-encrypt-renew.sh << 'EOF'
#!/bin/bash
# Auto-renewal script for Let's Encrypt certificates

certbot renew \
    --pre-hook "docker-compose -f docker-compose.production.yml stop nginx" \
    --post-hook "docker-compose -f docker-compose.production.yml start nginx"

# Copy renewed certificates
if [[ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]]; then
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" nginx/ssl/server.crt
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" nginx/ssl/server.key
    chown $USER:$USER nginx/ssl/server.crt nginx/ssl/server.key
    chmod 644 nginx/ssl/server.crt
    chmod 600 nginx/ssl/server.key
    
    # Reload nginx
    docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
fi
EOF
    
    chmod +x ../lets-encrypt-renew.sh
    
    echo -e "${GREEN}✅ Auto-renewal script created: lets-encrypt-renew.sh${NC}"
    echo -e "${BLUE}💡 Add to crontab: 0 12 * * * /path/to/lets-encrypt-renew.sh${NC}"
}

# Function to validate certificates
validate_certificates() {
    echo -e "${BLUE}🔍 Validating SSL certificates...${NC}"
    
    if [[ ! -f "server.crt" ]] || [[ ! -f "server.key" ]]; then
        echo -e "${RED}❌ Certificate files not found${NC}"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in server.crt -text -noout | grep -q "Certificate:"; then
        echo -e "${GREEN}✅ Certificate file is valid${NC}"
        
        # Show certificate details
        echo -e "${BLUE}📋 Certificate Details:${NC}"
        openssl x509 -in server.crt -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After :|DNS:|IP Address:)" || true
    else
        echo -e "${RED}❌ Certificate file is invalid${NC}"
        return 1
    fi
    
    # Check private key
    if openssl rsa -in server.key -check -noout &>/dev/null; then
        echo -e "${GREEN}✅ Private key is valid${NC}"
    else
        echo -e "${RED}❌ Private key is invalid${NC}"
        return 1
    fi
    
    # Check if certificate and key match
    cert_md5=$(openssl x509 -noout -modulus -in server.crt | openssl md5)
    key_md5=$(openssl rsa -noout -modulus -in server.key | openssl md5)
    
    if [[ "$cert_md5" == "$key_md5" ]]; then
        echo -e "${GREEN}✅ Certificate and private key match${NC}"
    else
        echo -e "${RED}❌ Certificate and private key do not match${NC}"
        return 1
    fi
    
    return 0
}

# Function to create DH parameters
generate_dhparam() {
    echo -e "${YELLOW}🔐 Generating Diffie-Hellman parameters...${NC}"
    echo -e "${BLUE}⏳ This may take a few minutes...${NC}"
    
    openssl dhparam -out dhparam.pem 2048
    chmod 644 dhparam.pem
    
    echo -e "${GREEN}✅ DH parameters generated: dhparam.pem${NC}"
}

# Main menu
main() {
    echo ""
    echo "Choose certificate generation method:"
    echo "1) Self-signed certificate (for development)"
    echo "2) Let's Encrypt certificate (for production)"
    echo "3) Validate existing certificates"
    echo "4) Generate DH parameters"
    echo "5) Exit"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            generate_self_signed
            validate_certificates
            echo ""
            echo -e "${GREEN}🎉 Self-signed certificate setup complete!${NC}"
            ;;
        2)
            setup_letsencrypt
            validate_certificates
            echo ""
            echo -e "${GREEN}🎉 Let's Encrypt certificate setup complete!${NC}"
            ;;
        3)
            validate_certificates
            ;;
        4)
            generate_dhparam
            ;;
        5)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}📝 Next Steps:${NC}"
    echo "1. Update nginx/nginx.conf with your domain name"
    echo "2. Start the services: docker-compose -f docker-compose.production.yml up -d"
    echo "3. Test HTTPS: curl -k https://localhost/health"
    echo "4. For production: Update DNS records to point to your server"
    echo ""
    echo -e "${BLUE}📍 Certificate files location: $(pwd)${NC}"
    echo -e "${GREEN}✅ server.crt - SSL certificate${NC}"
    echo -e "${GREEN}🔑 server.key - Private key${NC}"
    
    if [[ -f "dhparam.pem" ]]; then
        echo -e "${GREEN}🔐 dhparam.pem - DH parameters${NC}"
    fi
}

# Check dependencies
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}❌ OpenSSL is required but not installed${NC}"
    exit 1
fi

# Run main function
main