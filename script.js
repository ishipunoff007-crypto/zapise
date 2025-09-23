// Конфигурация для Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxza5sDlcb4b70ZpFTOw5TLIuScLP63ewjYAp_qTsplXT-IqgZQQSlsYCTixMaXOjYr/exec";

// DOM элементы
const form = document.getElementById('bookingForm');
const phoneInput = document.getElementById('phone');
const successMessage = document.getElementById('successMessage');
const submitButton = form.querySelector('button[type="submit"]');

// Маска для телефона
phoneInput.addEventListener('input', function(e) {
    const x = e.target.value.replace(/\D/g, '').match(/(\d{0,1})(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
    e.target.value = '+7' + (x[2] ? ' (' + x[2] : '') + (x[3] ? ') ' + x[3] : '') + (x[4] ? '-' + x[4] : '') + (x[5] ? '-' + x[5] : '');
});

// Валидация формы
function validateForm() {
    let isValid = true;

    // Валидация имени
    const nameInput = document.getElementById('name');
    if (!nameInput.value.trim()) {
        showError(nameInput, 'nameError');
        isValid = false;
    } else {
        hideError(nameInput, 'nameError');
    }

    // Валидация телефона
    const phoneDigits = phoneInput.value.replace(/\D/g,'');
    if (phoneDigits.length !== 11) {
        showError(phoneInput, 'phoneError');
        isValid = false;
    } else {
        hideError(phoneInput, 'phoneError');
    }

    // Валидация даты
    const dateInput = document.getElementById('date');
    if (!dateInput.value) {
        showError(dateInput, 'dateError');
        isValid = false;
    } else {
        hideError(dateInput, 'dateError');
    }

    // Валидация услуги
    const serviceInput = document.getElementById('service');
    if (!serviceInput.value) {
        showError(serviceInput, 'serviceError');
        isValid = false;
    } else {
        hideError(serviceInput, 'serviceError');
    }

    // Валидация согласия
    const agreeInput = document.getElementById('agree');
    if (!agreeInput.checked) {
        document.getElementById('agreeError').style.display = 'block';
        isValid = false;
    } else {
        document.getElementById('agreeError').style.display = 'none';
    }

    return isValid;
}

// Показать ошибку
function showError(input, errorId) {
    input.classList.add('error');
    document.getElementById(errorId).style.display = 'block';
}

// Скрыть ошибку
function hideError(input, errorId) {
    input.classList.remove('error');
    document.getElementById(errorId).style.display = 'none';
}

// Показать индикатор загрузки
function showLoading() {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Отправка...';
}

// Скрыть индикатор загрузки
function hideLoading() {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Записаться';
}

// Обработчик отправки формы
form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Валидация формы
    if (!validateForm()) {
        return;
    }

    // Собираем данные формы
    const formData = {
        name: document.getElementById('name').value.trim(),
        phone: phoneInput.value.trim(),
        date: document.getElementById('date').value,
        service: document.getElementById('service').value,
        timestamp: new Date().toISOString()
    };

    // Показываем индикатор загрузки
    showLoading();

    // Отправка данных в Google Таблицу
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow', // важно, чтобы следовал редиректу, который делает Apps Script
        body: JSON.stringify(formData),
        headers: {
            'Content-Type': 'text/plain;charset=utf-8' // ключевой трюк: не триггерит preflight
        }
    })
    .then(resp => resp.json())
    .then(data => {
        console.log('Ответ от Apps Script:', data);
        
        if (data.result === 'success') {
            // Показываем сообщение об успехе
            successMessage.style.display = 'block';
            form.reset();
            
            // Прокручиваем к сообщению об успехе
            successMessage.scrollIntoView({ behavior: 'smooth' });
            
            // Скрываем сообщение через 5 секунд
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 5000);
            
            // Дополнительное уведомление
            alert(`Спасибо, ${formData.name}! Ваша запись на ${formData.service} принята. Мы свяжемся с вами для подтверждения.`);
        } else {
            alert('Ошибка при записи: ' + (data.message || 'неизвестная ошибка'));
        }
    })
    .catch(err => {
        console.error('Ошибка при отправке в Google Таблицу:', err);
        alert('Не удалось отправить запись. Пожалуйста, попробуйте еще раз или свяжитесь с нами по телефону.');
    })
    .finally(() => {
        // Скрываем индикатор загрузки в любом случае
        hideLoading();
    });
});

// Дополнительная валидация при изменении полей
form.querySelectorAll('input, select').forEach(element => {
    element.addEventListener('blur', function() {
        validateForm();
    });
});

// Установка минимальной даты (сегодня)
document.getElementById('date').min = new Date().toISOString().split('T')[0];

// Обработчик для кнопки согласия - скрываем ошибку при клике
document.getElementById('agree').addEventListener('change', function() {
    if (this.checked) {
        document.getElementById('agreeError').style.display = 'none';
    }
});
