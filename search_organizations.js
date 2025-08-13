const https = require('https');

// Function to make HTTP request to GitHub API
function makeGitHubRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Myonsite-Org-Searcher',
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

// Function to search for organizations
async function searchOrganizations(query) {
  try {
    console.log(`🔍 Searching for organizations matching: "${query}"`);
    
    const path = `/search/users?q=${encodeURIComponent(query)}&type=org`;
    const results = await makeGitHubRequest(path);
    
    if (results.items && results.items.length > 0) {
      console.log(`\n📋 Found ${results.total_count} organizations:`);
      console.log('=====================================');
      
      results.items.forEach((org, index) => {
        console.log(`\n${index + 1}. ${org.login}`);
        console.log(`   Name: ${org.name || 'Not specified'}`);
        console.log(`   Description: ${org.bio || 'No description'}`);
        console.log(`   URL: ${org.html_url}`);
        console.log(`   Type: ${org.type}`);
        console.log(`   Avatar: ${org.avatar_url}`);
      });
      
      return results.items;
    } else {
      console.log('❌ No organizations found matching your query.');
      return [];
    }
    
  } catch (error) {
    console.error(`Error searching organizations: ${error.message}`);
    throw error;
  }
}

// Function to check if an organization exists
async function checkOrganizationExists(orgName) {
  try {
    const path = `/orgs/${orgName}`;
    const org = await makeGitHubRequest(path);
    return { exists: true, org };
  } catch (error) {
    if (error.message.includes('404')) {
      return { exists: false, org: null };
    }
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const searchTerms = ['Myonsite', 'myonsite', 'MyOnsite', 'my-onsite', 'my_onsite'];
    
    console.log('🔍 Searching for Myonsite organization...\n');
    
    // First, try exact matches
    for (const term of searchTerms) {
      console.log(`Checking exact match: ${term}`);
      const result = await checkOrganizationExists(term);
      
      if (result.exists) {
        console.log(`✅ Found organization: ${term}`);
        console.log(`   Name: ${result.org.name || 'Not specified'}`);
        console.log(`   Description: ${result.org.description || 'No description'}`);
        console.log(`   URL: ${result.org.html_url}`);
        console.log(`   Public repos: ${result.org.public_repos}`);
        console.log(`   Total repos: ${result.org.total_private_repos + result.org.public_repos}`);
        return;
      } else {
        console.log(`❌ Organization "${term}" not found`);
      }
      console.log('');
    }
    
    // If no exact matches, search for similar names
    console.log('🔍 No exact matches found. Searching for similar organizations...\n');
    
    for (const term of searchTerms) {
      if (term !== 'Myonsite') { // Skip the original term as we already checked it
        const orgs = await searchOrganizations(term);
        if (orgs.length > 0) {
          console.log(`\n💡 Found similar organizations for "${term}":`);
          break;
        }
      }
    }
    
    console.log('\n💡 Suggestions:');
    console.log('1. Check the exact spelling of the organization name');
    console.log('2. Verify the organization is public or you have access to it');
    console.log('3. Try searching on GitHub directly: https://github.com/Myonsite');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  searchOrganizations,
  checkOrganizationExists
};
