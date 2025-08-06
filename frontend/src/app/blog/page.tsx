'use client'

import Link from 'next/link'
import { CalendarIcon, ClockIcon, UserIcon, TagIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline'

export default function BlogPage() {
  const blogPosts = [
    {
      id: 1,
      title: "The Future of Edge Case Discovery in Autonomous Vehicles",
      slug: "future-edge-case-discovery-av",
      excerpt: "How AI-powered scenario search is revolutionizing the way AV teams validate their systems and discover critical edge cases that traditional testing methods miss.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "CEO & Co-Founder",
      publishDate: "2024-01-15",
      readTime: "8 min read",
      tags: ["autonomous vehicles", "edge cases", "AI", "safety"],
      featured: true,
      comments: 12
    },
    {
      id: 2,
      title: "Building Production-Ready AI Pipelines for Video Processing",
      slug: "production-ai-pipelines-video",
      excerpt: "Technical deep-dive into our infrastructure: from video ingestion to embedding generation, how we process thousands of hours of driving footage at scale.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "CTO & Co-Founder",
      publishDate: "2024-01-10",
      readTime: "12 min read",
      tags: ["engineering", "AI pipelines", "video processing", "scale"],
      featured: true,
      comments: 8
    },
    {
      id: 3,
      title: "Why OpenCLIP Outperforms Traditional Computer Vision for AV Scenarios",
      slug: "openclip-vs-traditional-cv",
      excerpt: "Comparing OpenCLIP's multimodal approach against traditional computer vision methods for understanding and categorizing driving scenarios.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "Head of Engineering",
      publishDate: "2024-01-05",
      readTime: "6 min read",
      tags: ["OpenCLIP", "computer vision", "multimodal AI", "research"],
      featured: false,
      comments: 15
    },
    {
      id: 4,
      title: "Lessons from YC: Building an AI Startup in 2024",
      slug: "yc-lessons-ai-startup-2024",
      excerpt: "Key insights from our Y Combinator experience and what we learned about building AI infrastructure for enterprise customers.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "CEO & Co-Founder",
      publishDate: "2023-12-28",
      readTime: "10 min read",
      tags: ["startup", "Y Combinator", "AI", "entrepreneurship"],
      featured: false,
      comments: 23
    },
    {
      id: 5,
      title: "The Data Challenge: Managing Petabytes of Driving Footage",
      slug: "data-challenge-petabytes-driving-footage",
      excerpt: "How we architected our storage and processing systems to handle massive amounts of driving data while maintaining performance and cost efficiency.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "CTO & Co-Founder",
      publishDate: "2023-12-20",
      readTime: "9 min read",
      tags: ["data engineering", "storage", "performance", "cost optimization"],
      featured: false,
      comments: 6
    },
    {
      id: 6,
      title: "Semantic Search vs Traditional Tagging: A Comparative Study",
      slug: "semantic-search-vs-tagging",
      excerpt: "Analysis of semantic search effectiveness compared to manual tagging systems for video content discovery in autonomous vehicle development.",
      content: "Lorem ipsum dolor sit amet...",
      author: "Raama Srivatsan",
      authorRole: "Head of Engineering",
      publishDate: "2023-12-15",
      readTime: "7 min read",
      tags: ["semantic search", "tagging", "user experience", "efficiency"],
      featured: false,
      comments: 4
    }
  ]

  const featuredPosts = blogPosts.filter(post => post.featured)
  const recentPosts = blogPosts.filter(post => !post.featured).slice(0, 4)
  
  const categories = [
    { name: "All Posts", count: blogPosts.length, active: true },
    { name: "Engineering", count: 3, active: false },
    { name: "AI & Research", count: 2, active: false },
    { name: "Company", count: 1, active: false },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">RareSift Blog</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Insights, engineering deep-dives, and the future of autonomous vehicle development
          </p>
        </div>

        {/* Featured Posts */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Posts</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredPosts.map((post) => (
              <article key={post.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <div className="text-center text-white p-6">
                      <div className="text-xs font-semibold bg-white bg-opacity-20 rounded-full px-3 py-1 mb-3">
                        FEATURED
                      </div>
                      <h3 className="text-xl font-bold leading-tight">{post.title}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <UserIcon className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link href={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Categories & Recent Posts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button key={category.name} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    category.active 
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">({category.count})</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Newsletter</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Get the latest insights on autonomous vehicles and AI delivered to your inbox.
              </p>
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Recent Posts */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recent Posts</h2>
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <article key={post.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 group hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <Link href={`/blog/${post.slug}`} className="block group">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <UserIcon className="h-4 w-4" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{new Date(post.publishDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="h-4 w-4" />
                          <span>{post.readTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          <span>{post.comments} comments</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link href={`/blog/${post.slug}`} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">
                      Read More →
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-3 px-6 rounded-lg transition-colors">
                Load More Posts
              </button>
            </div>
          </div>
        </div>

        {/* Popular Tags */}
        <div className="mt-12 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Popular Topics</h2>
          <div className="flex flex-wrap gap-3">
            {['autonomous vehicles', 'AI', 'edge cases', 'computer vision', 'safety', 'engineering', 'OpenCLIP', 'video processing', 'startup', 'Y Combinator'].map((tag) => (
              <button key={tag} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                #{tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}