const axios = require('axios');

const BASE_URL = 'http://localhost:6000/api/users';
const TEST_USERS = [
  {
    fullname: 'Test User',
    email: 'testuser@example.com',
    password: 'Test@1234',
    mobile: '9876543210',
    gender: 'Female',
    type: 'Donor',
    address: '123 Test Street',
    city: 'Hyderabad',
    state: 'Telangana',
    Url: 'https://example.com/profile.jpg'
  },
  {
    fullname: 'Another User',
    email: 'anotheruser@example.com',
    password: 'Test@1234',
    mobile: '9876543211',
    gender: 'Male',
    type: 'Donor',
    address: '456 Test Street',
    city: 'Hyderabad',
    state: 'Telangana',
    Url: 'https://example.com/profile2.jpg'
  }
];

(async () => {
  try {
    console.log('--- Deleting test users if they exist ---');
    for (const user of TEST_USERS) {
      try {
        await axios.post(`${BASE_URL}/delete-user`, { email: user.email });
        console.log(`Deleted user: ${user.email}`);
      } catch (err) {
        // If delete endpoint doesn’t exist, ignore
      }
    }

    console.log('--- Testing Signup ---');
    const signupResponse = await axios.post(`${BASE_URL}/signup`, TEST_USERS[0]);
    console.log('Signup Response:', signupResponse.data);

    console.log('--- Testing Login ---');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: TEST_USERS[0].email,
      password: TEST_USERS[0].password
    });
    console.log('Login Response:', loginResponse.data);

  } catch (err) {
    if (err.response) {
      console.error('Error Response:', err.response.data);
    } else {
      console.error(err);
    }
  }
})();
