const https = require('https');

// Configuration
const ORG_NAME = 'myonsite-healthcare';
const GITHUB_API_BASE = 'https://api.github.com';

// Function to make HTTP request to GitHub API
function makeGitHubRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Myonsite-Healthcare-Repo-Checker',
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

// Function to get organization info
async function getOrganizationInfo(orgName) {
  try {
    const path = `/orgs/${orgName}`;
    const org = await makeGitHubRequest(path);
    
    console.log('🏢 ORGANIZATION INFORMATION:');
    console.log('============================');
    console.log(`Name: ${org.name || org.login}`);
    console.log(`Login: ${org.login}`);
    console.log(`Description: ${org.description || 'No description'}`);
    console.log(`URL: ${org.html_url}`);
    console.log(`Public repos: ${org.public_repos}`);
    console.log(`Total private repos: ${org.total_private_repos || 0}`);
    console.log(`Total repos: ${org.public_repos + (org.total_private_repos || 0)}`);
    console.log(`Created: ${new Date(org.created_at).toLocaleDateString()}`);
    console.log(`Updated: ${new Date(org.updated_at).toLocaleDateString()}`);
    console.log('');
    
    return org;
  } catch (error) {
    console.error(`Error fetching organization info: ${error.message}`);
    throw error;
  }
}

// Function to get all repositories for an organization
async function getOrganizationRepos(orgName) {
  try {
    console.log(`📚 Fetching repositories for organization: ${orgName}`);
    
    const repos = [];
    let page = 1;
    let hasMore = true;
    
    while (hasMore) {
      const path = `/orgs/${orgName}/repos?page=${page}&per_page=100&sort=name`;
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
  console.log(`\n📊 Found ${repos.length} repositories in ${ORG_NAME} organization:\n`);
  
  repos.forEach((repo, index) => {
    const visibility = repo.private ? '🔒 Private' : '🌐 Public';
    const language = repo.language || 'No language specified';
    const description = repo.description || 'No description';
    
    console.log(`${index + 1}. ${repo.name}`);
    console.log(`   ${visibility} | Language: ${language}`);
    console.log(`   Description: ${description}`);
    console.log(`   URL: ${repo.html_url}`);
    console.log(`   Created: ${new Date(repo.created_at).toLocaleDateString()}`);
    console.log(`   Last updated: ${new Date(repo.updated_at).toLocaleDateString()}`);
    console.log(`   Stars: ⭐ ${repo.stargazers_count} | Forks: 🍴 ${repo.forks_count}`);
    console.log(`   Issues: 🐛 ${repo.open_issues_count}`);
    console.log('');
  });
}

// Function to generate summary statistics
function generateSummary(repos) {
  const totalRepos = repos.length;
  const publicRepos = repos.filter(repo => !repo.private).length;
  const privateRepos = repos.filter(repo => repo.private).length;
  
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

// Main execution
async function main() {
  try {
    console.log(`🔍 Checking repositories in ${ORG_NAME} organization...\n`);
    
    // First get organization info
    const orgInfo = await getOrganizationInfo(ORG_NAME);
    
    // Then get repositories
    const repos = await getOrganizationRepos(ORG_NAME);
    
    if (repos.length === 0) {
      console.log(`No repositories found in ${ORG_NAME} organization.`);
      return;
    }
    
    displayRepos(repos);
    generateSummary(repos);
    
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
  getOrganizationInfo,
  getOrganizationRepos,
  displayRepos,
  generateSummary
};
