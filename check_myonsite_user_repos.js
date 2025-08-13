const https = require('https');

// Configuration
const USER_NAME = 'Myonsite';
const GITHUB_API_BASE = 'https://api.github.com';

// Function to make HTTP request to GitHub API
function makeGitHubRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Myonsite-User-Repo-Checker',
        'Accept': 'application/vnd.github.v3+json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`GitHub API request failed with status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Function to get user info
async function getUserInfo(userName) {
  try {
    const path = `/users/${userName}`;
    const user = await makeGitHubRequest(path);
    
    console.log('👤 USER INFORMATION:');
    console.log('====================');
    console.log(`Name: ${user.name || user.login}`);
    console.log(`Login: ${user.login}`);
    console.log(`Bio: ${user.bio || 'No bio'}`);
    console.log(`Company: ${user.company || 'Not specified'}`);
    console.log(`Location: ${user.location || 'Not specified'}`);
    console.log(`Blog: ${user.blog || 'No blog'}`);
    console.log(`URL: ${user.html_url}`);
    console.log(`Public repos: ${user.public_repos}`);
    console.log(`Public gists: ${user.public_gists}`);
    console.log(`Followers: ${user.followers}`);
    console.log(`Following: ${user.following}`);
    console.log(`Created: ${new Date(user.created_at).toLocaleDateString()}`);
    console.log(`Updated: ${new Date(user.updated_at).toLocaleDateString()}`);
    console.log('');
    
    return user;
  } catch (error) {
    console.error(`Error fetching user info: ${error.message}`);
    throw error;
  }
}

// Function to get all repositories for a user
async function getUserRepos(userName) {
  try {
    console.log(`📚 Fetching repositories for user: ${userName}`);
    
    const repos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const path = `/users/${userName}/repos?page=${page}&per_page=100&sort=name`;
      console.log(`Fetching page ${page}...`);
      
      const pageRepos = await makeGitHubRequest(path);
      
      if (pageRepos.length === 0) {
        hasMore = false;
      } else {
        repos.push(...pageRepos);
        page++;
      }
      
      // Add a small delay to be respectful to GitHub's API
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return repos;
  } catch (error) {
    console.error(`Error fetching repositories: ${error.message}`);
    throw error;
  }
}

// Function to display repository information
function displayRepos(repos) {
  console.log(`\n📊 Found ${repos.length} repositories under ${USER_NAME} user:\n`);
  
  repos.forEach((repo, index) => {
    const visibility = repo.private ? '🔒 Private' : '🌐 Public';
    const language = repo.language || 'No language specified';
    const description = repo.description || 'No description';
    const forkStatus = repo.fork ? '🍴 Forked' : '📝 Original';
    
    console.log(`${index + 1}. ${repo.name}`);
    console.log(`   ${visibility} | ${forkStatus} | Language: ${language}`);
    console.log(`   Description: ${description}`);
    console.log(`   URL: ${repo.html_url}`);
    console.log(`   Created: ${new Date(repo.created_at).toLocaleDateString()}`);
    console.log(`   Last updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
    console.log(`   Stars: ⭐ ${repo.stargazers_count} | Forks: 🍴 ${repo.forks_count}`);
    console.log(`   Issues: 🐛 ${repo.open_issues_count}`);
    if (repo.fork) {
      console.log(`   Forked from: ${repo.source?.full_name || 'Unknown'}`);
    }
    console.log('');
  });
}

// Function to generate summary statistics
function generateSummary(repos) {
  const totalRepos = repos.length;
  const publicRepos = repos.filter(repo => !repo.private).length;
  const privateRepos = repos.filter(repo => repo.private).length;
  const forkedRepos = repos.filter(repo => repo.fork).length;
  const originalRepos = repos.filter(repo => !repo.fork).length;
  
  const languages = {};
  repos.forEach(repo => {
    const lang = repo.language || 'Unknown';
    languages[lang] = (languages[lang] || 0) + 1;
  });
  
  const topLanguages = Object.entries(languages)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
  
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  
  console.log('📈 SUMMARY STATISTICS:');
  console.log('========================');
  console.log(`Total repositories: ${totalRepos}`);
  console.log(`Public repositories: ${publicRepos}`);
  console.log(`Private repositories: ${privateRepos}`);
  console.log(`Original repositories: ${originalRepos}`);
  console.log(`Forked repositories: ${forkedRepos}`);
  console.log(`Total stars: ⭐ ${totalStars}`);
  console.log(`Total forks: 🍴 ${totalForks}`);
  console.log('');
  
  if (topLanguages.length > 0) {
    console.log('🏆 TOP LANGUAGES:');
    topLanguages.forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} repos`);
    });
  }
}

// Function to check if current repo is in the list
function checkCurrentRepo(repos) {
  const currentRepoName = 'AI-Games';
  const currentRepo = repos.find(repo => repo.name === currentRepoName);
  
  if (currentRepo) {
    console.log('\n📍 CURRENT REPOSITORY INFORMATION:');
    console.log('==================================');
    console.log(`Repository: ${currentRepo.name}`);
    console.log(`URL: ${currentRepo.html_url}`);
    console.log(`Visibility: ${currentRepo.private ? '🔒 Private' : '🌐 Public'}`);
    console.log(`Language: ${currentRepo.language || 'No language specified'}`);
    console.log(`Description: ${currentRepo.description || 'No description'}`);
    console.log(`Created: ${new Date(currentRepo.created_at).toLocaleDateString()}`);
    console.log(`Last updated: ${new Date(currentRepo.updated_at).toLocaleDateString()}`);
    console.log(`Stars: ⭐ ${currentRepo.stargazers_count} | Forks: 🍴 ${currentRepo.forks_count}`);
    console.log(`Issues: 🐛 ${currentRepo.open_issues_count}`);
    console.log('');
  }
}

// Main execution
async function main() {
  try {
    console.log(`🔍 Checking repositories under ${USER_NAME} user account...\n`);
    
    // First get user info
    const userInfo = await getUserInfo(USER_NAME);
    
    // Then get repositories
    const repos = await getUserRepos(USER_NAME);
    
    if (repos.length === 0) {
      console.log(`No repositories found under ${USER_NAME} user.`);
      return;
    }
    
    displayRepos(repos);
    generateSummary(repos);
    
    // Check if current repo is in the list
    checkCurrentRepo(repos);
    
    console.log('✅ Repository check completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('403')) {
      console.log('\n💡 Tip: You might need to authenticate with GitHub or check rate limits.');
      console.log('   Consider using a GitHub token for authenticated requests.');
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  getUserInfo,
  getUserRepos,
  displayRepos,
  generateSummary,
  checkCurrentRepo
};
