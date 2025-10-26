import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test contact form submission
async function testContactSubmission() {
  console.log('Testing contact form submission...');
  
  try {
    const response = await fetch(`${BASE_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Recaptcha-Token': 'test-token' // This will be validated by reCAPTCHA middleware
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a test message from the API test script.'
      })
    });

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Contact submission test passed!');
      return data.data?.id; // Return the contact ID for further tests
    } else {
      console.log('❌ Contact submission test failed!');
      return null;
    }
  } catch (error) {
    console.error('Error testing contact submission:', error);
    return null;
  }
}

// Test getting all contacts (requires admin token)
async function testGetContacts() {
  console.log('\nTesting get all contacts...');
  
  try {
    const response = await fetch(`${BASE_URL}/contact`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the endpoint exists
      }
    });

    console.log('Response status:', response.status);
    
    if (response.status === 401) {
      console.log('✅ Get contacts endpoint exists (auth required as expected)');
    } else {
      console.log('❌ Unexpected response from get contacts endpoint');
    }
  } catch (error) {
    console.error('Error testing get contacts:', error);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Contact API Tests...\n');
  
  // Test 1: Contact submission
  const contactId = await testContactSubmission();
  
  // Test 2: Get contacts (will fail auth, but endpoint should exist)
  await testGetContacts();
  
  console.log('\n🏁 Contact API Tests completed!');
  console.log('\nNote: Some tests may fail due to missing reCAPTCHA token or admin authentication.');
  console.log('This is expected behavior for security reasons.');
}

// Run the tests
runTests().catch(console.error); 