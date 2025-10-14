import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'CERT Framework',
  description: 'Consistency Evaluation and Reliability Testing for LLM Systems',

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'API Reference', link: '/api/core' },
      { text: 'Examples', link: '/guide/examples' },
      { text: 'GitHub', link: 'https://github.com/yourusername/cert-framework' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Core Concepts', link: '/guide/concepts' },
          ],
        },
        {
          text: 'Testing',
          items: [
            { text: 'Consistency Testing', link: '/guide/consistency' },
            { text: 'Accuracy Testing', link: '/guide/accuracy' },
            { text: 'Pipeline Analysis', link: '/guide/pipeline' },
            { text: 'Layer Enforcement', link: '/guide/layer-enforcement' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: 'LangChain', link: '/guide/langchain' },
            { text: 'Python', link: '/guide/python' },
            { text: 'pytest Plugin', link: '/guide/pytest' },
          ],
        },
        {
          text: 'Tools',
          items: [
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Inspector UI', link: '/guide/inspector' },
            { text: 'Storage', link: '/guide/storage' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Semantic Comparison', link: '/guide/semantic' },
            { text: 'Custom Rules', link: '/guide/custom-rules' },
            { text: 'Examples', link: '/guide/examples' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: '@cert/core', link: '/api/core' },
            { text: '@cert/semantic', link: '/api/semantic' },
            { text: '@cert/langchain', link: '/api/langchain' },
            { text: '@cert/cli', link: '/api/cli' },
            { text: 'Python API', link: '/api/python' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/yourusername/cert-framework' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 CERT Framework Contributors',
    },

    search: {
      provider: 'local',
    },
  },
});
