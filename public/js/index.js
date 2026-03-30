const container = document.getElementById('container');
const overlayCon = document.getElementById('overlayCon');
const overlayBtn = document.getElementById('overlayBtn');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('Password');
const signUpButton = document.getElementById('signup');
const loginemail = document.getElementById('loginemail')
const loginpassword = document.getElementById('loginpassword')
const loginbutton = document.getElementById('login')
const message = document.getElementById('message')
const signupmessage = document.getElementById('signupmessage')
const forgotpassword = document.getElementById('forgotpassword');
overlayBtn.addEventListener('click', () => {
    container.classList.toggle('right-panel-active');
});

signUpButton.addEventListener('click', (event) => {
    event.preventDefault();
    if (!nameInput.value || !emailInput.value || !passwordInput.value) {
        signupmessage.innerHTML = 'Please fill out all required fields';
        signupmessage.style.color = 'red';
        setTimeout(() => signupmessage.remove(), 5000);
        return;
    }

    const data = {
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
    };

    axios.post('/user/signup', data)
        .then(response => {
            if (response.data.success) {
                alert('Account created successfully');
            } else {
                signupmessage.innerHTML = 'This Account already exists';
                signupmessage.style.color = 'red';
                setTimeout(() => signupmessage.remove(), 5000);
            }
        })
        .catch(err => {
            console.log(err);
            signupmessage.innerHTML = 'An error occurred';
            signupmessage.style.color = 'red';
            setTimeout(() => signupmessage.remove(), 5000);
        });
})

loginbutton.addEventListener('click', (event) => {
    event.preventDefault();
    if (!loginemail.value || !loginpassword.value) {
        message.innerHTML = 'Please fill out all required fields';
        message.style.color = 'red';
        setTimeout(() => message.remove(), 5000);
        return;
    }

    const data = {
        email: loginemail.value,
        password: loginpassword.value,
    };

    axios.post('/user/login', data)
        .then(response => {
            if (response.data.success) {
                localStorage.setItem('token', response.data.token)
                window.location.href = '/user';
            }
            else {
                message.innerHTML = 'Invalid email or password';
                message.style.color = 'red'
                setTimeout(() => message.remove(), 5000);
            }
        })
        .catch(error => {
            alert('An error occurred during login');
        });
});


