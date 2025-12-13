/**
 * Check Cursor Cloud Agent Status Script
 * Uses Cursor Cloud Agents API to check if an agent has finished
 * Documentation: https://cursor.com/docs/cloud-agent/api/endpoints
 */

const API_KEY = 'key_241e3749d4c2ee6c727b981474e909edc2e4d3047aca96f1825d104e818efb03'
const AGENT_ID = 'bc-6b5f3681-a7ce-49d1-b2d8-7484320561a8'

// Cursor Cloud Agents API endpoint
const API_ENDPOINT = `https://api.cursor.com/v0/agents/${AGENT_ID}`

async function checkAgentStatus() {
  console.log(`Checking Cursor Cloud Agent status for: ${AGENT_ID}`)
  console.log(`Using API key: ${API_KEY.substring(0, 20)}...`)
  console.log(`Endpoint: ${API_ENDPOINT}`)
  console.log('')

  try {
    // Cursor API uses Basic Authentication
    // Format: -u API_KEY: (empty password)
    const authHeader = Buffer.from(`${API_KEY}:`).toString('base64')
    
    const response = await fetch(API_ENDPOINT, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ SUCCESS!')
      console.log('Response:', JSON.stringify(data, null, 2))
      
      // Check if agent is finished
      // Status can be: FINISHED, RUNNING, etc.
      const status = data.status
      const isFinished = status === 'FINISHED'

      console.log('\n📊 Status Summary:')
      console.log(`  Agent ID: ${data.id || AGENT_ID}`)
      console.log(`  Name: ${data.name || 'N/A'}`)
      console.log(`  Status: ${status || 'unknown'}`)
      console.log(`  Finished: ${isFinished ? '✅ YES' : '❌ NO'}`)
      
      if (data.summary) {
        console.log(`  Summary: ${data.summary}`)
      }
      
      if (data.target?.prUrl) {
        console.log(`  PR URL: ${data.target.prUrl}`)
      }
      
      if (data.target?.url) {
        console.log(`  Agent URL: ${data.target.url}`)
      }
      
      if (data.createdAt) {
        console.log(`  Created At: ${data.createdAt}`)
      }
      
      return { success: true, data, isFinished, status }
    } else {
      const errorText = await response.text()
      console.log(`❌ Failed: ${response.status} ${response.statusText}`)
      
      if (errorText) {
        try {
          const errorJson = JSON.parse(errorText)
          console.log(`Error: ${JSON.stringify(errorJson, null, 2)}`)
        } catch {
          console.log(`Error: ${errorText.substring(0, 500)}`)
        }
      }
      
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    if (error.stack) {
      console.log(`Stack: ${error.stack}`)
    }
    return { success: false, error: error.message }
  }
}

checkAgentStatus()
  .then(result => {
    if (result.success) {
      if (result.isFinished) {
        console.log('\n✅ Agent has FINISHED!')
        process.exit(0)
      } else {
        console.log(`\n⏳ Agent is still ${result.status || 'RUNNING'}`)
        process.exit(1)
      }
    } else {
      console.log('\n❌ Failed to check agent status')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

