document.addEventListener('DOMContentLoaded', () => {
    // Comprobar en qué página estamos
    const isLoginPage = window.location.pathname.includes('login.html');
    const isRegisterPage = window.location.pathname.includes('register.html');

    // Obtener el elemento de párrafo para los mensajes
    const messageEl = document.getElementById('message');

    // Función para obtener usuarios del almacenamiento local
    const getUsers = () => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    // Función para guardar usuarios en el almacenamiento local
    const saveUsers = (users) => {
        localStorage.setItem('users', JSON.stringify(users));
    };

    // Función para mostrar mensajes
    const displayMessage = (message, isError = true) => {
        messageEl.textContent = message;
        messageEl.style.color = isError ? '#d9534f' : '#4CAF50';
    };

    // --- Lógica de registro ---
    if (isRegisterPage) {
        const registerForm = document.getElementById('registerForm');
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = registerForm.username.value.trim();
            const email = registerForm.email.value.trim();
            const password = registerForm.password.value.trim();

            if (!username || !email || !password) {
                displayMessage('Por favor, completa todos los campos.');
                return;
            }

            const users = getUsers();

            // Comprobar si el nombre de usuario o el correo electrónico ya existen
            const userExists = users.some(user => user.username.toLowerCase() === username.toLowerCase());
            const emailExists = users.some(user => user.email.toLowerCase() === email.toLowerCase());

            if (userExists) {
                displayMessage('El nombre de usuario ya existe. Por favor, elige otro.');
                return;
            }
            
            if (emailExists) {
                displayMessage('El correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.');
                return;
            }

            // Crear un nuevo objeto de usuario
            const newUser = {
                username,
                email,
                password
            };

            // Añadir el nuevo usuario al array y guardarlo
            users.push(newUser);
            saveUsers(users);

            // Mostrar mensaje de éxito y redirigir
            displayMessage('Registro exitoso. Redirigiendo a la página de inicio de sesión...', false);
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        });
    }

    // --- Lógica de inicio de sesión ---
    if (isLoginPage) {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const username = loginForm.username.value.trim();
            const password = loginForm.password.value.trim();

            if (!username || !password) {
                displayMessage('Por favor, ingresa tu nombre de usuario y contraseña.');
                return;
            }

            const users = getUsers();

            // Encontrar al usuario en el array
            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                // Si se encuentra el usuario, guardar su información de sesión y redirigir
                sessionStorage.setItem('loggedInUser', JSON.stringify(user));
                displayMessage('Inicio de sesión exitoso. ¡Bienvenido!', false);
                setTimeout(() => {
                    // Redirigir a la página principal de la aplicación de Tic-Tac-Toe
                    window.location.href = 'index.html'; 
                }, 1500);
            } else {
                // Usuario no encontrado o credenciales incorrectas
                displayMessage('Nombre de usuario o contraseña incorrectos.');
            }
        });
    }
});