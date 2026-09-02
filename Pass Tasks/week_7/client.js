const baseUrl = 'http://localhost:3000';

async function runDemo() {
  try {
    // CREATE
    console.log('\n1. CREATE - POST a new sensor reading');

    let response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Room Temperature Sensor',
        address: '221 Burwood Hwy, Burwood VIC 3125',
        temperature: 24
      })
    });

    let data = await response.json();

    console.log('Status:', response.status);
    console.log(data);

    if (!response.ok) {
      throw new Error(`POST failed with status ${response.status}`);
    }

    const createdId = data.sensor._id;

    // READ ALL
    console.log('\n2. READ - GET all sensor readings');

    response = await fetch(baseUrl);
    data = await response.json();

    console.log('Status:', response.status);
    console.log(data);

    // READ ONE
    console.log('\n3. READ - GET newly created sensor by ID');

    response = await fetch(`${baseUrl}/${createdId}`);
    data = await response.json();

    console.log('Status:', response.status);
    console.log(data);

    // UPDATE
    console.log('\n4. UPDATE - PUT sensor temperature to 29');

    response = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temperature: 29,
        name: 'Updated Temperature Sensor'
      })
    });

    data = await response.json();

    console.log('Status:', response.status);
    console.log(data);

    // DELETE
    console.log('\n5. DELETE - remove sensor reading');

    response = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE'
    });

    data = await response.json();

    console.log('Status:', response.status);
    console.log(data);

    console.log('\nCRUD demonstration complete.');
  } catch (error) {
    console.error('\nClient error:', error);
  }
}

runDemo();