/**
 * API Route: Request College
 * Sends email to ratemyprofgn@gmail.com when users request a new college
 */

import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { collegeName, city, state, yourName, yourEmail, additionalInfo } = req.body

    // Validate required fields
    if (!collegeName || !city || !state || !yourName || !yourEmail) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate email format - using simple, non-backtracking validation
    // This prevents ReDoS (Regular Expression Denial of Service) attacks
    // Format: basic check for @ and . without polynomial regex patterns
    const emailStr = String(yourEmail).trim();
    
    // Basic structure checks (no regex, O(n) time complexity)
    const hasNoSpaces = !emailStr.includes(' ');
    const hasAt = emailStr.includes('@');
    const parts = emailStr.split('@');
    const hasValidStructure = parts.length === 2 && 
                              parts[0].length > 0 && 
                              parts[1].includes('.') &&
                              parts[1].split('.').every(p => p.length > 0) &&
                              !parts[1].startsWith('.') &&
                              !parts[1].endsWith('.') &&
                              emailStr.length <= 254; // RFC 5321 max length
    
    if (!hasNoSpaces || !hasAt || !hasValidStructure) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Send email to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1'
    const apiUrl = backendUrl.replaceAll('/v1', '')
    
    const response = await fetch(`${apiUrl}/api/request-college`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        college_name: collegeName,
        city,
        state,
        requester_name: yourName,
        requester_email: yourEmail,
        additional_info: additionalInfo
      })
    })

    if (!response.ok) {
      // If backend API fails, still return success but log the error
      console.error('Backend API error:', await response.text())
      
      // Fallback: Log to console (in production, you might want to use a different service)
      console.log('College Request:', {
        collegeName,
        city,
        state,
        yourName,
        yourEmail,
        additionalInfo,
        timestamp: new Date().toISOString()
      })
    }

    return res.status(200).json({ 
      success: true,
      message: 'College request submitted successfully' 
    })

  } catch (error) {
    console.error('Error processing college request:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
