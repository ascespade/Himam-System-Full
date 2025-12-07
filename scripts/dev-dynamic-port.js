#!/usr/bin/env node

/**
 * Dynamic Port Dev Server
 * Automatically finds an available port and starts Next.js dev server
 */

const { spawn } = require('child_process')
const net = require('net')

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.listen(port, () => {
      server.once('close', () => resolve(true))
      server.close()
    })
    server.on('error', () => resolve(false))
  })
}

/**
 * Find an available port starting from the preferred port
 */
async function findAvailablePort(startPort = 3000, maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    const available = await isPortAvailable(port)
    if (available) {
      return port
    }
  }
  throw new Error(`Could not find an available port after ${maxAttempts} attempts`)
}

/**
 * Main function
 */
async function main() {
  try {
    // Get preferred port from environment or use 3000
    const preferredPort = parseInt(process.env.PORT || '3000', 10)
    
    console.log(`🔍 Looking for available port starting from ${preferredPort}...`)
    
    // Find available port
    const port = await findAvailablePort(preferredPort)
    
    console.log(`✅ Found available port: ${port}`)
    console.log(`🚀 Starting Next.js dev server on http://localhost:${port}`)
    console.log('')
    
    // Set port in environment
    process.env.PORT = port.toString()
    
    // Start Next.js dev server
    const nextDev = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      shell: false,
      env: {
        ...process.env,
        PORT: port.toString(),
      },
    })
    
    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down dev server...')
      nextDev.kill('SIGINT')
      process.exit(0)
    })
    
    process.on('SIGTERM', () => {
      nextDev.kill('SIGTERM')
      process.exit(0)
    })
    
    // Handle errors
    nextDev.on('error', (error) => {
      console.error('❌ Error starting Next.js:', error)
      process.exit(1)
    })
    
    nextDev.on('exit', (code) => {
      process.exit(code || 0)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Run main function
main()

