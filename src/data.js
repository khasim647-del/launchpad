// Starting data for the homepage.
// Edit these lists to change what appears the first time someone opens Launchpad.

export const DEFAULT_BOOKMARKS = [
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com' },
  { id: 'github', name: 'GitHub', url: 'https://github.com' },
  { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com' },
  { id: 'drive', name: 'Google Drive', url: 'https://drive.google.com' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com' },
]

export const TOP_SITES = [
  { name: 'Google', url: 'https://www.google.com', description: 'Search the web' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', description: 'The free encyclopedia' },
  { name: 'Amazon', url: 'https://www.amazon.com', description: 'Online shopping' },
  { name: 'Reddit', url: 'https://www.reddit.com', description: 'Communities and discussion' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: 'Programming Q&A' },
]

export const SEARCH_ENGINES = {
  google: {
    label: 'Google',
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search Google…',
  },
  youtube: {
    label: 'YouTube',
    url: 'https://www.youtube.com/results?search_query=',
    placeholder: 'Search YouTube videos…',
  },
}
