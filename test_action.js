const axios = require('axios');

async function run(){
  try{
    const login = await axios.post('http://localhost:4000/api/auth/login',{ username: 'admin', password: 'admin123' })
    const token = login.data.token
    console.log('Token obtained')

    // Try break (should set breakTaken)
    const br = await axios.post('http://localhost:4000/api/attendances/action', { action: 'break' }, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Break response:', br.data)

    // Try checkin without photo (should fail)
    try{
      const noPhoto = await axios.post('http://localhost:4000/api/attendances/action', { action: 'checkin' }, { headers: { Authorization: `Bearer ${token}` } })
      console.log('No-photo checkin (unexpected):', noPhoto.data)
    }catch(e){
      console.log('No-photo checkin error (expected):', e.response?.data || e.message)
    }

    // Try checkin with placeholder photo
    const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='
    const ci = await axios.post('http://localhost:4000/api/attendances/action', { action: 'checkin', photo: samplePhoto }, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Checkin with photo response:', ci.data)

    // Try checkout with photo
    const co = await axios.post('http://localhost:4000/api/attendances/action', { action: 'checkout', photo: samplePhoto }, { headers: { Authorization: `Bearer ${token}` } })
    console.log('Checkout response:', co.data)
  }catch(err){
    console.error('Error', err.response?.data || err.message)
  }
}

run()
