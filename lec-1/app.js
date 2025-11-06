let slides = [];
let currentIndex = 0;

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
}

async function loadSlides() {
    try {
        const res = await fetch('data.json');
        if (!res.ok) {
            throw new Error(`Failed to load data.json: ${res.status}`);
        }
        const data = await res.json();
        if (!data || data.length === 0) {
            console.error('No slides found in data.json');
            document.getElementById('slideText').innerHTML = '<p style="color: red;">لا توجد شرائح في الملف</p>';
            return;
        }
        
        // تحويل البيانات إلى تنسيق الشرائح
        slides = data.map(slide => ({
            id: slide.slide_number,
            title: `${slide.slide_title_ar} - ${slide.slide_title_en}`,
            image: `img/${slide.slide_number}.png`,
            content: slide
        }));
        
        slides.sort((a, b) => a.id - b.id);
        buildMenu();
        
        const hashId = parseInt((location.hash || '').replace('#slide-', ''), 10);
        const startIndex = Number.isFinite(hashId) ? slides.findIndex(s => s.id === hashId) : 0;
        currentIndex = startIndex >= 0 ? startIndex : 0;
        renderCurrent();
    } catch (error) {
        console.error('Error loading slides:', error);
        document.getElementById('slideText').innerHTML = `<p style="color: red;">خطأ في تحميل الشرائح: ${error.message}</p>`;
    }
}

function buildMenu() {
    const menu = document.getElementById('slides-menu');
    menu.innerHTML = '';
    slides.forEach((s, idx) => {
        const a = document.createElement('a');
        a.href = `#slide-${s.id}`;
        a.textContent = `الشريحة ${s.id}`;
        a.addEventListener('click', (e) => {
            e.preventDefault();
            currentIndex = idx;
            renderCurrent();
            if (window.innerWidth <= 768) closeSidebar();
        });
        menu.appendChild(a);
    });
    updateActiveMenu();
}

function updateActiveMenu() {
    const menu = document.getElementById('slides-menu');
    [...menu.querySelectorAll('a')].forEach((el, i) => {
        el.classList.toggle('active', i === currentIndex);
    });
}

function setStatus() {
    const status = document.getElementById('statusText');
    const statusBottom = document.getElementById('statusTextBottom');
    const statusBottom2 = document.getElementById('statusTextBottom2');
    const statusText = `${currentIndex + 1} / ${slides.length}`;
    status.textContent = statusText;
    if (statusBottom) statusBottom.textContent = statusText;
    if (statusBottom2) statusBottom2.textContent = statusText;
}

function formatSlideContent(slide) {
    if (!slide) return '<p>لا يوجد محتوى</p>';
    
    let html = '';
    
    // عرض الملخص العام
    if (slide.general_summary_ar) {
        html += `<div class="explanation-block">
            <div class="explanation-label">الملخص العام:</div>
            <div class="explanation-content">${slide.general_summary_ar}</div>
        </div>`;
        html += '<div class="separator"></div>';
    }
    
    // عرض التفاصيل والنصوص
    if (slide.details_and_text && slide.details_and_text.length > 0) {
        slide.details_and_text.forEach(detail => {
            if (detail.text_en) {
                html += `<div class="text-block">
                    <div class="text-label">النص الإنجليزي:</div>
                    <div class="text-content">${detail.text_en}</div>
                </div>`;
            }
            
            if (detail.explanation_ar) {
                html += `<div class="explanation-block">
                    <div class="explanation-label">الشرح:</div>
                    <div class="explanation-content">${detail.explanation_ar}</div>
                </div>`;
                html += '<div class="separator"></div>';
            }
        });
    }
    
    // عرض الأسئلة العربية
    if (slide.questions_ar) {
        if (slide.questions_ar.a_current_slide && slide.questions_ar.a_current_slide.length > 0) {
            html += `<div class="explanation-block">
                <div class="explanation-label">أسئلة حول الشريحة الحالية:</div>
                <div class="explanation-content">`;
            slide.questions_ar.a_current_slide.forEach((question, index) => {
                html += `<p><strong>س${index + 1}:</strong> ${question}</p>`;
            });
            html += `</div></div>`;
            html += '<div class="separator"></div>';
        }
        
        if (slide.questions_ar.b_previous_slides && slide.questions_ar.b_previous_slides.length > 0) {
            html += `<div class="explanation-block">
                <div class="explanation-label">أسئلة تربط مع الشرائح السابقة:</div>
                <div class="explanation-content">`;
            slide.questions_ar.b_previous_slides.forEach((item, index) => {
                if (typeof item === 'string') {
                    html += `<p><strong>س${index + 1}:</strong> ${item}</p>`;
                } else if (item.question_ar) {
                    html += `<p><strong>س${index + 1}:</strong> ${item.question_ar}</p>`;
                    if (item.hint_ar) {
                        html += `<p><em>تلميح: ${item.hint_ar}</em></p>`;
                    }
                }
            });
            html += `</div></div>`;
            html += '<div class="separator"></div>';
        }
    }
    
    // عرض الأسئلة الإنجليزية والعربية
    if (slide.questions_en_ar) {
        if (slide.questions_en_ar.a_current_slide_qa && slide.questions_en_ar.a_current_slide_qa.length > 0) {
            html += `<div class="explanation-block">
                <div class="explanation-label">أسئلة تفاعلية:</div>
                <div class="explanation-content">`;
            slide.questions_en_ar.a_current_slide_qa.forEach((qa, index) => {
                html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(124, 58, 237, 0.05); border-radius: 8px;">`;
                
                let questionText = qa.question_en;
                if (qa.type === 'Multiple Choice') {
                    // فصل السؤال عن الخيارات
                    const parts = questionText.split(': ');
                    if (parts.length > 1) {
                        const question = parts[0] + ':';
                        const choices = parts[1];
                        // فصل الخيارات
                        const choicesList = choices.split(/\s*\([a-d]\)\s*/).filter(choice => choice.trim());
                        const choiceLetters = choices.match(/\([a-d]\)/g) || [];
                        
                        html += `<p><strong>${qa.type} - س${index + 1}:</strong> ${question}</p>`;
                        html += `<div style="margin: 10px 0; padding-left: 20px;">`;
                        
                        choiceLetters.forEach((letter, i) => {
                            if (choicesList[i]) {
                                html += `<p style="margin: 5px 0;"><strong>${letter}</strong> ${choicesList[i].trim()}</p>`;
                            }
                        });
                        html += `</div>`;
                    } else {
                        html += `<p><strong>${qa.type} - س${index + 1}:</strong> ${questionText}</p>`;
                    }
                } else {
                    html += `<p><strong>${qa.type} - س${index + 1}:</strong> ${questionText}</p>`;
                }
                
                html += `<p><strong>الإجابة:</strong> ${qa.answer_en}</p>`;
                html += `<p><strong>الشرح:</strong> ${qa.explanation_ar}</p>`;
                html += `</div>`;
            });
            html += `</div></div>`;
            html += '<div class="separator"></div>';
        }
        
        if (slide.questions_en_ar.b_previous_slides && slide.questions_en_ar.b_previous_slides.length > 0) {
            html += `<div class="explanation-block">
                <div class="explanation-label">أسئلة ربط مع الشرائح السابقة:</div>
                <div class="explanation-content">`;
            slide.questions_en_ar.b_previous_slides.forEach((item, index) => {
                html += `<p><strong>س${index + 1}:</strong> ${item.question_ar}</p>`;
                if (item.hint_ar) {
                    html += `<p><em>تلميح: ${item.hint_ar}</em></p>`;
                }
            });
            html += `</div></div>`;
        }
    }
    
    return html || '<p>لا يوجد محتوى</p>';
}

async function renderCurrent() {
    const slide = slides[currentIndex];
    if (!slide) return;
    
    location.hash = `slide-${slide.id}`;
    document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
    
    document.getElementById('slideTitle').textContent = slide.title;
    
    const img = document.getElementById('slideImage');
    img.src = slide.image;
    img.alt = `صورة الشريحة ${slide.id}`;
    img.onerror = function () {
        this.style.display = 'none';
        console.error('Failed to load image:', slide.image);
    };
    img.onload = function () {
        this.style.display = 'block';
    };
    
    const textEl = document.getElementById('slideText');
    textEl.innerHTML = formatSlideContent(slide.content);
    
    setStatus();
    updateActiveMenu();
    
    document.getElementById('prevBtn').disabled = currentIndex === 0;
    document.getElementById('nextBtn').disabled = currentIndex === slides.length - 1;
    document.getElementById('prevBtnBottom').disabled = currentIndex === 0;
    document.getElementById('nextBtnBottom').disabled = currentIndex === slides.length - 1;
    document.getElementById('prevBtnBottom2').disabled = currentIndex === 0;
    document.getElementById('nextBtnBottom2').disabled = currentIndex === slides.length - 1;
}

function next() {
    if (currentIndex < slides.length - 1) {
        currentIndex += 1;
        renderCurrent();
    }
}

function prev() {
    if (currentIndex > 0) {
        currentIndex -= 1;
        renderCurrent();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('prevBtn').addEventListener('click', prev);
    document.getElementById('nextBtn').addEventListener('click', next);
    document.getElementById('prevBtnBottom').addEventListener('click', prev);
    document.getElementById('nextBtnBottom').addEventListener('click', next);
    document.getElementById('prevBtnBottom2').addEventListener('click', prev);
    document.getElementById('nextBtnBottom2').addEventListener('click', next);
    loadSlides();
});

window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeSidebar();
});