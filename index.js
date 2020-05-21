const axios = require('axios');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');

const questions = [
    {
        type: 'input',
        name: 'username',
        message: 'What is your github username?'
    },
    {
        type: 'input',
        name: 'repo',
        message: 'What is the name or URL of the repository you wish to generate a README for?'
    }
];

const repoQuestion = [
    {
        type: 'input',
        name: 'repo',
        message: 'Try inputting the name or URL of another repository:'
    }
];

var githubUser;

start();

function writeToFile(fileName, data) {
    fs.writeFile(fileName, data, 'utf8', function(err) {
        if (err) throw err;
    });
}

function start() {
    // Ask users the predefined questions
    inquirer.prompt(questions)
        .then(answers => {
            // Save the username and repo given by the user
            const {username, repo} = answers;
            githubUser = username.trim();

            const githubURL = `https://api.github.com/users/${githubUser}/repos?per_page=100`;

            axios.get(githubURL)
                .then(response => {
                    getRepoInfo(response, repo);
                })
                .catch(error => {
                    console.log(`I'm sorry, I wasn't able to find any Github accounts with the username ${githubUser}, please try again.`);
                    start();
                });
        })
        .catch(error => {
            throw error;
        });
}

function getRepoInfo(response, repoName) {
    let foundRepo = null;

    // Remove any spaces from the repoName
    repoName = repoName.replace(/ /g, '').trim();

    // Try to find repo with given name or URL
    for (repo of response.data) {
        if (repo.name.toLowerCase() == repoName.toLowerCase() ||
            repo.html_url.toLowerCase() == repoName.toLowerCase()) {
            foundRepo = repo;
            break;
        }
    }

    // Re-ask the user what the repo is if none are found with the given name
    if (foundRepo == null) {
        console.log(`I'm sorry, I didn't find any repos in your Github account with that name!`);
        return inquireRepo(response);
    }

    generateReadMe(foundRepo);
}

function inquireRepo(response) {
    // Ask _only_ the repo name - we already got their username before
    inquirer.prompt(repoQuestion)
        .then(answers => {
            // Save the repo given by the user
            const {repo} = answers;

            getRepoInfo(response, repo);
        })
        .catch(error => {
            throw error;
        });
}

function generateReadMe(repo) {
    let readme = '';

    // Check to see if this repo has a language already in it, so we can create a badge for it
    if (repo.language) {
        readme += `![Language](https://img.shields.io/badge/language-${repo.language.toLowerCase()}-blue)`;
    }

    // Generate badges for, last commit, and commit activity for this repo
    readme += ` ![LastCommit](https://img.shields.io/github/last-commit/${repo.owner.login}/${repo.name}?style=flat-square) ![CommitActivity](https://img.shields.io/github/commit-activity/m/${repo.owner.login}/${repo.name})\n`;

    // Add Title
    readme += `\n# ${formatTitle(repo.name)}\n`;

    // Project description
    readme += `\n## Description\n${repo.description || 'Description of project here'}\n`;

    // Table of contents
    readme += `\n## Table of Contents
    * [Installation](#installation)
    * [Usage](#usage)
    * [License](#license)
    * [Contributing](#contributing)
    * [Tests](#tests)
    * [Questions](#questions)\n`;
    
    // Installation
    readme += `\n## Installation\nInstallation instructions here\n`;

    // Usage
    readme += `\n## Usage\nUsage instructions here\n`;

    // License
    readme += `\n## License\nEasy way to choose your license: https://choosealicense.com/\n`;

    // Contributing
    readme += `\n## Contributing\nContribution instructions here\n`;

    // Tests
    readme += `\n## Tests\nInstructions on running automated tests here\n`;

    // Questions
    readme += `\n## Questions\nInquiries? Send them to: {your email} ![Github](${repo.owner.avatar_url}&s=32)\n`;

    // Make the output folder if it doesn't exist yet
    if (!fs.existsSync(path.join(__dirname, 'output'))) {
        fs.mkdirSync(path.join(__dirname, 'output'));
    }

    // Write all content to readme
    writeToFile('output/README.md', readme);

    console.log(`README.md successfully generated! You'll find your readme in the ${__dirname}/output folder.`);
}

function formatTitle(repoTitle) {
    // Split word up by capital letters
    // so 'thisTitle' becomes ['this', 'Title']
    words = repoTitle.split(/(?=[A-Z])/);

    // Make the first letter of each word capitalized
    for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let upperChar = word.charAt(0).toUpperCase();
        newWord = upperChar + word.substr(1);
        words[i] = newWord;
    }

    return words.join(' ');
}