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
        slides = data.map(slide => {
            const slideNumber = Array.isArray(slide.slide_number) ? slide.slide_number[0] : slide.slide_number;
            const slideNumbers = Array.isArray(slide.slide_number) ? slide.slide_number : [slide.slide_number];
            
            const slideRange = slideNumbers.length > 1 ? slideNumbers.join('-') : slideNumbers[0];
            
            return {
                id: slideNumber,
                title: `${slideRange}- ${slide.slide_title_ar} - ${slide.slide_title_en}`,
                images: slideNumbers.map(num => `img/${num}.png`),
                content: slide,
                slideNumbers: slideNumbers,
                slideRange: slideRange
            };
        });
        
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
        a.textContent = `${s.slideRange}- ${s.content.slide_title_ar} - ${s.content.slide_title_en}`;
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
                let explanationContent = detail.explanation_ar;
                
                // تحويل \n إلى <br>
                explanationContent = explanationContent.replace(/\\n/g, '<br>');
                
                // تحويل **النص** إلى <strong>
                explanationContent = explanationContent.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #7c3aed; font-weight: 700;">$1</strong>');
                
                // تحويل جداول Markdown إلى HTML
                explanationContent = explanationContent.replace(/\|(.+)\|/g, (match, content) => {
                    const cells = content.split('|').map(cell => cell.trim());
                    const isHeaderSeparator = cells.every(cell => cell.match(/^-+$/));
                    
                    if (isHeaderSeparator) {
                        return ''; // تجاهل خط الفصل
                    }
                    
                    const cellTags = cells.map((cell, index) => {
                        const isHeader = index === 0;
                        const style = `padding: 12px 15px; border: 1px solid rgba(124, 58, 237, 0.3); text-align: right; direction: rtl; ${isHeader ? 'background: rgba(124, 58, 237, 0.1); font-weight: 600;' : 'background: rgba(124, 58, 237, 0.05);'}`;
                        return `<td style="${style}">${cell}</td>`;
                    }).join('');
                    return `<tr>${cellTags}</tr>`;
                });
                
                // إضافة تاغ الجدول إذا وُجدت صفوف
                if (explanationContent.includes('<tr>')) {
                    explanationContent = explanationContent.replace(/(<tr>.*<\/tr>)/gs, '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: rgba(124, 58, 237, 0.08); border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid rgba(124, 58, 237, 0.2);">$1</table>');
                }
                
                html += `<div class="explanation-block">
                    <div class="explanation-label">الشرح:</div>
                    <div class="explanation-content">${explanationContent}</div>
                </div>`;
                
                if (detail.mermaid_diagram) {
                    html += `<div class="explanation-block">
                        <div class="explanation-label">المخطط التوضيحي:</div>
                        <div class="mermaid-container" style="margin: 15px 0; padding: 25px; background: #2d2d56; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); text-align: center; overflow: hidden;">
                            <div class="mermaid" style="display: inline-block; transform: scale(1.1); transform-origin: center; margin: 20px;">${detail.mermaid_diagram}</div>
                        </div>
                    </div>`;
                }
                
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
                const questionId = `question-${currentIndex}-${index}`;
                html += `<div style="margin-bottom: 15px; padding: 10px; background: rgba(124, 58, 237, 0.05); border-radius: 8px;">`;
                
                if (qa.type === 'Multiple Choice') {
                    html += `<p style="direction: ltr; text-align: left;"><strong>${qa.type} - س${index + 1}:</strong> ${qa.question_en}</p>`;
                    if (qa.options && qa.options.length > 0) {
                        html += `<div style="margin: 10px 0; padding-left: 20px; direction: ltr; text-align: left;">`;
                        qa.options.forEach(option => {
                            html += `<p style="margin: 5px 0;">${option}</p>`;
                        });
                        html += `</div>`;
                    }
                } else {
                    html += `<p style="direction: ltr; text-align: left;"><strong>${qa.type} - س${index + 1}:</strong> ${qa.question_en}</p>`;
                }
                
                html += `<button onclick="toggleAnswer('${questionId}')" class="show-answer-btn" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-family: 'Cairo', sans-serif; font-weight: 500; font-size: 13px; margin: 10px 0; transition: all 0.3s ease; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3); border: 1px solid rgba(34, 197, 94, 0.4);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(34, 197, 94, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(34, 197, 94, 0.3)'">عرض الجواب</button>`;
                html += `<div id="${questionId}" class="answer-section" style="display: none; margin-top: 10px; padding: 10px; background: rgba(34, 197, 94, 0.1); border-radius: 6px; border: 1px solid rgba(34, 197, 94, 0.2); direction: rtl; text-align: right;">`;
                html += `<p><strong>الإجابة:</strong> ${qa.answer_en}</p>`;
                html += `<p><strong>الشرح:</strong> ${qa.explanation_ar}</p>`;
                html += `</div>`;
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
    
    const imgContainer = document.getElementById('slideImageContainer');
    imgContainer.innerHTML = '';
    
    slide.images.forEach((imageSrc, index) => {
        const img = document.createElement('img');
        img.src = imageSrc;
        img.alt = `صورة الشريحة ${slide.slideNumbers[index]}`;
        img.style.width = '100%';
        img.style.maxWidth = '800px';
        img.style.height = 'auto';
        img.style.borderRadius = '12px';
        img.style.margin = '10px auto';
        img.style.display = 'block';
        img.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
        img.style.border = '1px solid rgba(255,255,255,0.1)';
        
        img.onerror = function () {
            this.style.display = 'none';
            console.error('Failed to load image:', imageSrc);
        };
        
        imgContainer.appendChild(img);
    });
    
    const textEl = document.getElementById('slideText');
    textEl.innerHTML = formatSlideContent(slide.content);
    
    // رندر مخططات Mermaid إذا كانت موجودة
    if (typeof mermaid !== 'undefined') {
        mermaid.init();
    }
    
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

function toggleAnswer(questionId) {
    const answerDiv = document.getElementById(questionId);
    const button = answerDiv.previousElementSibling;
    
    if (answerDiv.style.display === 'none') {
        answerDiv.style.display = 'block';
        button.textContent = 'إخفاء الجواب';
        button.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        button.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        button.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    } else {
        answerDiv.style.display = 'none';
        button.textContent = 'عرض الجواب';
        button.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
        button.style.borderColor = 'rgba(34, 197, 94, 0.4)';
        button.style.boxShadow = '0 2px 8px rgba(34, 197, 94, 0.3)';
    }
}