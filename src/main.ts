import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
    try {
        const token = core.getInput('token') || process.env.GITHUB_TOKEN || ''
        const projectName = core.getInput('name', { required: true })
        const projectDescription = core.getInput('description')
        const columns = core.getInput('columns')

        const octokit = new github.GitHub(token)
        let response

        if (core.getInput('org')) {
            response = await octokit.projects.createForOrg({
                org: core.getInput('org'),
                name: projectName,
                body: projectDescription
            })
        } else {
            let repo: string | undefined = core.getInput('repo')

            if (!repo && !(repo = process.env.GITHUB_REPOSITORY))
                throw new Error('could not determine correct repository')

            if (!repo.includes('/'))
                throw new Error('repo must be specified as owner/repo')

            const components = repo.split('/', 2)

            response = await octokit.projects.createForRepo({
                owner: components[0],
                repo: components[1],
                name: projectName,
                body: projectDescription
            })
        }

        if (columns) {
            for (const column of columns.split(',')) {
                await octokit.projects.createColumn({
                    project_id: response.data.id,
                    name: column.trim()
                })
            }
        }

        core.setOutput('url', response.data.html_url)
    } catch (err) {
        core.setFailed(err.message)
    }
}

run()
