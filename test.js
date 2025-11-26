const axios = require('axios');
let data = '';

let config = {
  method: 'post',
  maxBodyLength: Infinity,
  url: 'https://api.w1chat.com/account/profile',
  headers: { 
    'token': '12345678', 
    'username': '7364076458'
  },
  data : data
};

axios.request(config)
.then((response) => {
  console.log(JSON.stringify(response.data));
})
.catch((error) => {
  console.log(error);
});

