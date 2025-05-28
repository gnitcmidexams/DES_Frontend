const API_BASE_URL = 'https://des-backend-n4p7.onrender.com/api';

document.getElementById('excelFile').addEventListener('change', handleFileUpload);
document.getElementById('generateButton').addEventListener('click', generateQuestionPaper);
document.getElementById('downloadButton').addEventListener('click', downloadQuestionPaper);
document.getElementById('paperType').addEventListener('change', handlePaperTypeChange);

// Function to show notifications below a specific element
function showNotification(message, type = 'info', targetElement, duration = null) {
    const notification = document.createElement('div');
    notification.innerText = message;
    notification.style.position = 'absolute';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.color = '#fff';
    notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';

    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#28a745';
            break;
        case 'error':
            notification.style.backgroundColor = '#dc3545';
            break;
        case 'info':
        default:
            notification.style.backgroundColor = '#007bff';
            break;
    }

    const rect = targetElement.getBoundingClientRect();
    notification.style.top = `${rect.bottom + window.scrollY + 10}px`;
    notification.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(notification);

    if (duration) {
        setTimeout(() => {
            if (notification.parentElement) {
                document.body.removeChild(notification);
            }
        }, duration);
    }

    return notification;
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('excelFile', file);

    const uploadElement = document.getElementById('excelFile');
    const uploadNotification = showNotification('File is uploading...', 'info', uploadElement);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error uploading file');

        document.body.removeChild(uploadNotification);
        showNotification('Successfully uploaded!', 'success', uploadElement, 3000);
    } catch (error) {
        console.error('Upload Error:', error);
        document.body.removeChild(uploadNotification);
        showNotification('Error uploading file: ' + error.message, 'error', uploadElement, 3000);
    }
}

async function generateQuestionPaper() {
    const paperType = document.getElementById('paperType').value;
    let requestBody = { paperType };
    if (paperType === 'special') {
        const mainUnit = parseInt(document.getElementById('mainUnit').value);
        requestBody.mainUnit = mainUnit;
    }

    const generateButton = document.getElementById('generateButton');
    const generatingNotification = showNotification('Generating question paper...', 'info', generateButton);

    try {
        const response = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Error generating question paper');

        const questionsWithImages = await Promise.all(data.questions.map(async q => {
            if (q.imageUrl) {
                q.imageDataUrl = await fetchImageDataUrl(q.imageUrl);
            }
            return q;
        }));

        data.paperDetails.paperType = paperType;

        sessionStorage.setItem('questions', JSON.stringify(questionsWithImages));
        sessionStorage.setItem('paperDetails', JSON.stringify(data.paperDetails));
        displayQuestionPaper(questionsWithImages, data.paperDetails, true);

        // Show the download button and add the format select dropdown
        // Show the download button and add the format select dropdown
const downloadButton = document.getElementById('downloadButton');
downloadButton.style.display = 'block';

// Remove any existing format select if it exists
const existingSelect = document.getElementById('formatSelect');
if (existingSelect) {
    existingSelect.remove();
}

// Create and style the format select dropdown
const formatSelect = document.createElement('select');
formatSelect.id = 'formatSelect';
formatSelect.innerHTML = `
    <option value="word" selected>Word</option>
    <option value="pdf">PDF</option>
`;
formatSelect.style.cssText = `
    margin-right: 10px;              
    padding: 10px 15px;              /* Increased padding for larger size */
    font-size: 16px;                 /* Larger text size */
    width: 120px;                    /* Fixed width for larger appearance */
    height: 40px;                    /* Increased height */
    border-radius: 5px;              /* Matches notification border-radius */
    border: 1px solid #007bff;       /* Blue border to match info notifications */
    background-color: #fff;          /* White background */
    color: #007bff;                  /* Blue text to match theme */
    cursor: pointer;                 /* Hand cursor on hover */
    box-shadow: 0 2px 5px rgba(0,0,0,0.2); /* Matches notification shadow */
    outline: none;                   /* Removes default focus outline */
`;
formatSelect.addEventListener('mouseover', () => {
    formatSelect.style.backgroundColor = '#f2f2f2'; // Light grey hover effect
});
formatSelect.addEventListener('mouseout', () => {
    formatSelect.style.backgroundColor = '#fff'; // Revert to white
});
downloadButton.parentNode.insertBefore(formatSelect, downloadButton);
        

        document.body.removeChild(generatingNotification);
        showNotification('Question paper generated successfully!', 'success', generateButton, 3000);
    } catch (error) {
        console.error('Generation Error:', error);
        document.body.removeChild(generatingNotification);
        showNotification('Error generating question paper: ' + error.message, 'error', generateButton, 3000);
    }
}

function displayQuestionPaper(questions, paperDetails, allowEdit = true) {
    const examDate = sessionStorage.getItem('examDate') || '';
    const branch = sessionStorage.getItem('branch') || paperDetails.branch;
    const subjectCode = sessionStorage.getItem('subjectCode') || paperDetails.subjectCode;
    const monthyear = sessionStorage.getItem('monthyear') || '';

    const midTermMap = { 'mid1': 'Mid I', 'mid2': 'Mid II', 'special': 'Special Mid' };
    const midTermText = midTermMap[paperDetails.paperType] || 'Mid';

    const getCOValue = (unit) => {
        switch (unit) {
            case 1: return 'CO1';
            case 2: return 'CO2';
            case 3: return 'CO3';
            case 4: return 'CO4';
            case 5: return 'CO5';
            default: return '';
        }
    };

    const html = `
        <div id="questionPaperContainer" style="padding: 20px; margin: 20px auto; text-align: center; max-width: 800px;">
            <div style="display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid black; padding-bottom: 5px;">
                <div style="text-align: left; width: 100%; font-weight: semi-bold;">
                    <p><strong>Subject Code:</strong> <span contenteditable="true" style="border-bottom: 1px solid black; min-width: 100px; display: inline-block;" oninput="sessionStorage.setItem('subjectCode', this.innerText)">${subjectCode}</span></p>
                </div>
                <div style="flex-grow: 1; text-align: center;">
                    <img src="image.jpeg" alt="Institution Logo" style="max-width: 100%; height: auto;">
                </div>
            </div>
            <h3>B.Tech ${paperDetails.year} Year ${paperDetails.semester} Semester ${midTermText} Examinations
                <span contenteditable="true" style="border-bottom: 1px solid black; min-width: 150px; display: inline-block;" 
                      oninput="sessionStorage.setItem('monthyear', this.innerText)">${monthyear}</span></h3>
                      <p> (${paperDetails.regulation} Regulation)<p>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                <p><span style="float: left;"><strong>Time:</strong> 90 Min.</span></p>
                <p><span style="float: right;"><strong>Max Marks:</strong> 20</span></p>
            </div>          
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                <p><span style="float: left;"><strong>Subject:</strong> ${paperDetails.subject}</span></p>
                <p><span style="float: left;"><strong>Branch:</strong> <span contenteditable="true" style="border-bottom: 1px solid black; min-width: 100px; display: inline-block;" oninput="sessionStorage.setItem('branch', this.innerText)">${branch}</span></span></p>
                <p><span style="float: right;"><strong>Date:</strong> <span contenteditable="true" style="border-bottom: 1px solid black; min-width: 100px; display: inline-block; text-align: center;" oninput="sessionStorage.setItem('examDate', this.innerText)">${examDate}</span></span></p>
            </div>
            <hr style="border-top: 1px solid black; margin: 10px 0;">
            <p style="text-align: left; margin-top: 10px;"><strong>Note:</strong> Question paper consists of 2 ½ Units, Answer any 4 full questions out of 6 questions.</p>
            <p style="text-align: left;">Each question carries 5 marks and may have sub-questions.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>S. No</th>
                        <th>Question</th>
                        <th>Unit</th>
                        <th>B.T Level</th>
                        <th>CO</th>
                        ${allowEdit ? '<th>Edit</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                ${questions.map((q, index) => `
                    <tr id="row-${index}">
                        <td>${index + 1}</td>
                        <td contenteditable="true" oninput="updateQuestion(${index}, this.innerText)">
                            ${q.question}
                            ${q.imageDataUrl ? `
                                <br>
                                <div id="image-container-${index}" style="max-width: 200px; max-height: 200px; margin-top: 5px;">
                                    <img src="${q.imageDataUrl}" style="max-width: 100%; max-height: 100%; display: block;" onload="console.log('Image displayed for question ${index + 1}')" onerror="console.error('Image failed to display for question ${index + 1}')">
                                </div>
                            ` : ''}
                        </td>
                        <td>${q.unit}</td>
                        <td contenteditable="true" oninput="updateBTLevel(${index}, this.innerText)">${q.btLevel}</td>
                        <td>${getCOValue(q.unit)}</td>
                        ${allowEdit ? `<td><button onclick="editQuestion(${index})">Edit</button></td>` : ''}
                    </tr>
                `).join('')}
                </tbody>
            </table>
            <br>
            <br>
            <p style="text-align: center;"><strong>****ALL THE BEST****</strong></p>
        </div>
    `;
    document.getElementById('questionPaper').innerHTML = html;
}

function updateQuestion(index, text) {
    let questions = JSON.parse(sessionStorage.getItem('questions'));
    questions[index].question = text;
    sessionStorage.setItem('questions', JSON.stringify(questions));
}

function updateBTLevel(index, text) {
    let questions = JSON.parse(sessionStorage.getItem('questions'));
    questions[index].btLevel = text;
    sessionStorage.setItem('questions', JSON.stringify(questions));
}

function editQuestion(index) {
    const questions = JSON.parse(sessionStorage.getItem('questions'));
    const question = questions[index];
    
    const modalHtml = `
        <div id="editModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
            <div style="background: white; padding: 20px; border-radius: 5px; width: 80%; max-width: 600px;">
                <h3>Edit Question #${index + 1}</h3>
                <div style="margin-bottom: 15px;">
                    <label for="questionText" style="display: block; margin-bottom: 5px;">Question Text:</label>
                    <textarea id="questionText" style="width: 100%; height: 100px;">${question.question}</textarea>
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="btLevel" style="display: block; margin-bottom: 5px;">B.T. Level:</label>
                    <input type="text" id="btLevel" style="width: 100%;" value="${question.btLevel || ''}">
                </div>
                <div style="margin-bottom: 15px;">
                    <label for="imageUrl" style="display: block; margin-bottom: 5px;">Image URL (leave empty to remove):</label>
                    <input type="text" id="imageUrl" style="width: 100%;" value="${question.imageUrl || ''}">
                    ${question.imageDataUrl ? `
                        <div style="margin-top: 10px;">
                            <img src="${question.imageDataUrl}" style="max-width: 100%; max-height: 200px;" onload="console.log('Edit image loaded')" onerror="console.error('Edit image failed')">
                        </div>
                    ` : ''}
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 10px;">
                    <button onclick="closeEditModal()">Cancel</button>
                    <button onclick="saveQuestion(${index})">Save</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modalContainer';
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);
}

function closeEditModal() {
    const modalContainer = document.getElementById('modalContainer');
    if (modalContainer) {
        document.body.removeChild(modalContainer);
    }
}

async function saveQuestion(index) {
    const questions = JSON.parse(sessionStorage.getItem('questions'));
    const questionText = document.getElementById('questionText').value;
    const btLevel = document.getElementById('btLevel').value.trim();
    const imageUrl = document.getElementById('imageUrl').value.trim();
    
    questions[index].question = questionText;
    questions[index].btLevel = btLevel;
    questions[index].imageUrl = imageUrl || null;
    if (imageUrl) {
        questions[index].imageDataUrl = await fetchImageDataUrl(imageUrl);
    } else {
        questions[index].imageDataUrl = null;
    }
    
    sessionStorage.setItem('questions', JSON.stringify(questions));
    closeEditModal();
    displayQuestionPaper(questions, JSON.parse(sessionStorage.getItem('paperDetails')), true);
}

async function fetchImageDataUrl(imageUrl) {
    try {
        const response = await fetch(`${API_BASE_URL}/image-proxy-base64?url=${encodeURIComponent(imageUrl)}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to fetch image');
        console.log(`Fetched data URL for ${imageUrl}, length: ${data.dataUrl.length}`);
        return data.dataUrl;
    } catch (error) {
        console.error(`Error fetching image data URL for ${imageUrl}:`, error);
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvElEQVR4nO3YQQqDMBAF0L/KnW+/Q6+xu1oSLeI4DAgAAAAAAAAA7rZpm7Zt2/9eNpvNZrPZdrsdANxut9vt9nq9PgAwGo1Go9FoNBr9MabX6/U2m01mM5vNZnO5XC6X+wDAXC6Xy+VyuVwul8sFAKPRaDQajUaj0Wg0Go1Goz8A8Hg8Ho/H4/F4PB6Px+MBgMFoNBqNRqPRaDQajUaj0Wg0Go1Goz8AAAAAAAAA7rYBAK3eVREcAAAAAElFTkSuQmCC';
    }
}

async function downloadQuestionPaper() {
    const questions = JSON.parse(sessionStorage.getItem('questions') || '[]');
    const paperDetails = JSON.parse(sessionStorage.getItem('paperDetails') || '{}');
    const monthyear = sessionStorage.getItem('monthyear') || '';
    const format = document.getElementById('formatSelect').value; // Get selected format

    if (!questions.length || !Object.keys(paperDetails).length) {
        showNotification('No question paper data found to download.', 'error', document.getElementById('downloadButton'), 3000);
        return;
    }

    const midTermMap = { 'mid1': 'Mid I', 'mid2': 'Mid II', 'special': 'Special Mid' };
    const midTermText = midTermMap[paperDetails.paperType] || 'Mid';
    const downloadButton = document.getElementById('downloadButton');
    const generatingNotification = showNotification(`Generating ${format.toUpperCase()} document...`, 'info', downloadButton);

    try {
        if (format === 'pdf') {
            await generatePDF(questions, paperDetails, monthyear, midTermText, downloadButton, generatingNotification);
        } else { // Default to Word
            await generateWord(questions, paperDetails, monthyear, midTermText, downloadButton, generatingNotification);
        }
        displayQuestionPaper(questions, paperDetails, true);
    } catch (error) {
        console.error(`${format.toUpperCase()} Generation Error:`, error);
        document.body.removeChild(generatingNotification);
        showNotification(`Error generating ${format.toUpperCase()} document: ${error.message}`, 'error', downloadButton, 3000);
    }
}

async function generatePDF(questions, paperDetails, monthyear, midTermText, downloadButton, generatingNotification) {
    const hiddenContainer = document.createElement('div');
    hiddenContainer.style.position = 'absolute';
    hiddenContainer.style.left = '-9999px';
    hiddenContainer.style.top = '-9999px';
    document.body.appendChild(hiddenContainer);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 9;
    const maxContentHeight = pageHeight - 2 * margin;
    let currentYPosition = margin;
    let isFirstPage = true;

    const checkPageOverflow = async (contentHeight) => {
        if (currentYPosition + contentHeight > maxContentHeight) {
            pdf.addPage();
            currentYPosition = margin;
            isFirstPage = false;
            await renderBlock(tableHeaderHtml, pageWidth - 2 * margin, false);
        }
    };

    const renderBlock = async (htmlContent, blockWidth, addSpacing = false) => {
        hiddenContainer.innerHTML = htmlContent;
        hiddenContainer.style.margin = '10';
        hiddenContainer.style.padding = '0';
        const canvas = await html2canvas(hiddenContainer, { 
            scale: 2, 
            useCORS: true,
            ignoreElements: (element) => element.tagName === 'SCRIPT'
        });
        const imgData = canvas.toDataURL('image/jpeg');
        const imgWidth = blockWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        await checkPageOverflow(imgHeight);
        pdf.addImage(imgData, 'JPEG', margin, currentYPosition, imgWidth, imgHeight);
        currentYPosition += imgHeight + (addSpacing ? 2 : 0);
    };

    const headerHtml = `
        <div style="width: ${pageWidth - 2 * margin}mm; font-family: Helvetica; text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; border-bottom: 1px solid black; padding-bottom: 5px;">
                <div style="text-align: left; width: 100%; font-weight: semi-bold;">
                    <p><strong>Subject Code:</strong> ${sessionStorage.getItem('subjectCode') || paperDetails.subjectCode}</p>
                </div>
                <div style="flex-grow: 1; text-align: center;">
                    <img src="image.jpeg" alt="Institution Logo" style="max-width: 100%; height: auto;">
                </div>
            </div>
            <h3>B.Tech ${paperDetails.year} Year ${paperDetails.semester} Semester ${midTermText} Examinations ${monthyear}</h3>
            <p>(${paperDetails.regulation} Regulation)</p>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 5px 0;">
                <p><span style="float: left;"><strong>Time:</strong> 90 Min.</span></p>
                <p><span style="float: right;"><strong>Max Marks:</strong> 20</span></p>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top:0px;align-items: center; padding: 2px 0;">
                <p><strong>Subject:</strong> ${paperDetails.subject}</p>
                <p><span style="float: left;"><strong>Branch:</strong> ${sessionStorage.getItem('branch') || paperDetails.branch}</span></p>
                <p><span style="float: right; margin-left: 20px;"><strong>Date:</strong> ${sessionStorage.getItem('examDate') || ''}</span></p>
            </div>
            <hr style="border-top: 1px solid black; margin: 2px 0;">
        </div>
    `;
    await renderBlock(headerHtml, pageWidth - 2 * margin, true);

    const noteHtml = `
        <div style="width: ${pageWidth - 2 * margin}mm; font-family: Helvetica; text-align: left; font-size:14px;  margin-top: 5px;">
            <p><strong>Note:</strong> Question paper consists of 2 ½ Units, Answer any 4 full questions out of 6 questions.</p>
            <p>Each question carries 5 marks and may have sub-questions.</p>
        </div>
    `;
    await renderBlock(noteHtml, pageWidth - 2 * margin, true);

    const tableHeaderHtml = `
        <div style="width: ${pageWidth - 2 * margin}mm; font-family: Helvetica;">
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; padding: 0;">
                <thead>
                    <tr style="background-color: #f2f2f2; font-size:14px;">
                        <th style="padding: 5px; border: 1px solid black; width: 10%; text-align: center; margin: 0;">S. No</th>
                        <th style="padding: 5px; border: 1px solid black; width: 60%; text-align: center; margin: 0;">Question</th>
                        <th style="padding: 5px; border: 1px solid black; width: 8%;  text-align: center; margin: 0;">Unit</th>
                        <th style="padding: 5px; border: 1px solid black; width: 12%; margin: 0;text-align: center; font-size:12px;">B.T Level</th>
                        <th style="padding: 5px; border: 1px solid black; width: 10%; text-align: center; margin: 0;">CO</th>
                    </tr>
                </thead>
            </table>
        </div>
    `;
    await renderBlock(tableHeaderHtml, pageWidth - 2 * margin, false);

    for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        const rowHtml = `
            <div style="width: ${pageWidth - 2 * margin}mm; font-family: Helvetica; margin: 0; padding: 0;">
                <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; padding: 0;">
                    <tbody style="margin: 0; padding: 0; font-size:14px;">
                        <tr style="margin: 0; padding: 0;">
                            <td style="padding: 5px; border-top: 0px solid black; border-left: 1px solid black;  border-right: 1px solid black; border-bottom: 1px solid black; text-align: center; width: 10%; margin: 0;">${index + 1}</td>
                            <td style="padding: 5px; font-size:14px; border-top: 0px solid black; border-left: 1px solid black;  border-right: 1px solid black; border-bottom: 1px solid black; width: 60%; margin: 0;">
                                ${q.question}
                                ${q.imageDataUrl ? `
                                    <div style="max-width: 200px; max-height: 200px; margin: 0; padding: 0;">
                                        <img src="${q.imageDataUrl}" style="max-width: 100%; max-height: 100%; display: block; margin: 0; padding: 0;">
                                    </div>
                                ` : ''}
                            </td>
                            <td style="padding: 5px;  border-top: 0px solid black;  border-left: 1px solid black;  border-right: 1px solid black; border-bottom: 1px solid black; width: 8%; text-align: center; margin: 0;">${q.unit}</td>
                            <td style="padding: 5px; border-top: 0px solid black; border-left: 1px solid black;  border-right: 1px solid black; border-bottom: 1px solid black; width: 12%; text-align: center; margin: 0;">${q.btLevel}</td>
                            <td style="padding: 5px; border-top: 0px solid black; border-left: 1px solid black; border-right: 1px solid black; border-bottom: 1px solid black; width: 10%; text-align: center; margin: 0;">${getCOValue(q.unit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
        await renderBlock(rowHtml, pageWidth - 2 * margin, false);
    }

    const footerHtml = `
        <div style="width: ${pageWidth - 2 * margin}mm; font-family: Helvetica; text-align: center; margin-top: 20px;">
            <p style="font-weight: bold;">****ALL THE BEST****</p>
        </div>
    `;
    await renderBlock(footerHtml, pageWidth - 2 * margin, true);

    pdf.save(`${paperDetails.subject}.pdf`);
    document.body.removeChild(generatingNotification);
    showNotification('PDF downloaded successfully!', 'success', downloadButton, 3000);
    document.body.removeChild(hiddenContainer);
}

async function generateWord(questions, paperDetails, monthyear, midTermText, downloadButton, generatingNotification) {
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun, BorderStyle } = docx;

    let logoArrayBuffer;
    try {
        const logoResponse = await fetch('image.jpeg');
        logoArrayBuffer = await logoResponse.arrayBuffer();
    } catch (error) {
        console.error('Error fetching logo:', error);
        logoArrayBuffer = await (await fetch('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAvElEQVR4nO3YQQqDMBAF0L/KnW+/Q6+xu1oSLeI4DAgAAAAAAAAA7rZpm7Zt2/9eNpvNZrPZdrsdANxut9vt9nq9PgAwGo1Go9FoNBr9MabX6/U2m01mM5vNZnO5XC6X+wDAXC6Xy+VyuVwul8sFAKPRaDQajUaj0Wg0Go1Goz8A8Hg8Ho/H4/F4PB6Px+MBgMFoNBqNRqPRaDQajUaj0Wg0Go1Goz8AAAAAAAAA7rYBAK3eVREcAAAAAElFTkSuQmCC')).arrayBuffer();
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } }
            },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Subject Code: ${sessionStorage.getItem('subjectCode') || paperDetails.subjectCode}`,
                            bold: true,
                            font: 'Times New Roman'
                        })
                    ],
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new ImageRun({
                            data: logoArrayBuffer,
                            transformation: { width: 600, height: 100 }
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `B.Tech ${paperDetails.year} Year ${paperDetails.semester} Semester ${midTermText} Examinations ${monthyear}`,
                            bold: true,
                            size: 28,
                            font: 'Times New Roman'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `(${paperDetails.regulation} Regulation)`,
                            font: 'Times New Roman'
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: "Time: 90 Min.",
                                                    bold: true,
                                                    font: 'Times New Roman'
                                                })
                                            ],
                                            alignment: AlignmentType.LEFT
                                        })
                                    ]
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: "Max Marks: 20",
                                                    bold: true,
                                                    font: 'Times New Roman'
                                                })
                                            ],
                                            alignment: AlignmentType.RIGHT
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                        insideHorizontal: { style: BorderStyle.NONE },
                        insideVertical: { style: BorderStyle.NONE }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `Subject: ${paperDetails.subject}`,
                                                    bold: true,
                                                    font: 'Times New Roman'
                                                })
                                            ],
                                            alignment: AlignmentType.LEFT
                                        }),
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `Branch: ${sessionStorage.getItem('branch') || paperDetails.branch}`,
                                                    bold: true,
                                                    font: 'Times New Roman'
                                                })
                                            ],
                                            alignment: AlignmentType.LEFT,
                                            spacing: { before: 50 }
                                        })
                                    ]
                                }),
                                new TableCell({
                                    width: { size: 50, type: WidthType.PERCENTAGE },
                                    children: [
                                        new Paragraph({
                                            children: [
                                                new TextRun({
                                                    text: `Date: ${sessionStorage.getItem('examDate') || ''}`,
                                                    bold: true,
                                                    font: 'Times New Roman'
                                                })
                                            ],
                                            alignment: AlignmentType.RIGHT
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                }),
                new Paragraph({
                    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } },
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "Note: ", bold: true, font: 'Times New Roman' }),
                        new TextRun({ text: "Question paper consists of 2 ½ Units, Answer any 4 full questions out of 6 questions.", font: 'Times New Roman' })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "Each question carries 5 marks and may have sub-questions.", font: 'Times New Roman' })],
                    spacing: { after: 200 }
                }),
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        left: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        right: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        insideHorizontal: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
                        insideVertical: { style: BorderStyle.SINGLE, size: 6, color: '000000' }
                    },
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "S. No", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                }),
                                new TableCell({
                                    width: { size: 60, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "Question", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                }),
                                new TableCell({
                                    width: { size: 8, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "Unit", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                }),
                                new TableCell({
                                    width: { size: 12, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "B.T Level", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                }),
                                new TableCell({
                                    width: { size: 10, type: WidthType.PERCENTAGE },
                                    children: [new Paragraph({ text: "CO", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                })
                            ],
                            tableHeader: true
                        }),
                        ...await Promise.all(questions.map(async (q, index) => {
                            const questionParts = q.question.split('<br>').map(part => part.trim()).filter(part => part.length > 0);
                            const cellChildren = questionParts.map(part => 
                                new Paragraph({
                                    children: [new TextRun({ text: part, font: 'Times New Roman' })],
                                    alignment: AlignmentType.LEFT
                                })
                            );

                            if (q.imageDataUrl) {
                                try {
                                    const response = await fetch(q.imageDataUrl);
                                    const arrayBuffer = await response.arrayBuffer();
                                    cellChildren.push(
                                        new Paragraph({
                                            children: [
                                                new ImageRun({
                                                    data: arrayBuffer,
                                                    transformation: { width: 200, height: 200 }
                                                })
                                            ],
                                            alignment: AlignmentType.CENTER,
                                            spacing: { before: 100 }
                                        })
                                    );
                                } catch (error) {
                                    console.error(`Error loading image for question ${index + 1}:`, error);
                                    cellChildren.push(new Paragraph({ text: "[Image could not be loaded]", font: 'Times New Roman' }));
                                }
                            }

                            return new TableRow({
                                children: [
                                    new TableCell({
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ text: `${index + 1}`, alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                    }),
                                    new TableCell({
                                        width: { size: 60, type: WidthType.PERCENTAGE },
                                        children: cellChildren
                                    }),
                                    new TableCell({
                                        width: { size: 8, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ text: `${q.unit}`, alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                    }),
                                    new TableCell({
                                        width: { size: 12, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ text: q.btLevel || "N/A", alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                    }),
                                    new TableCell({
                                        width: { size: 10, type: WidthType.PERCENTAGE },
                                        children: [new Paragraph({ text: getCOValue(q.unit), alignment: AlignmentType.CENTER, font: 'Times New Roman' })]
                                    })
                                ]
                            });
                        }))
                    ]
                }),
                new Paragraph({
                    children: [new TextRun({ text: "****ALL THE BEST****", bold: true, font: 'Times New Roman' })],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 }
                })
            ]
        }]
    });

    const blob = await Packer.toBlob(doc);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${paperDetails.subject}.docx`;
    link.click();

    document.body.removeChild(generatingNotification);
    showNotification('Word document downloaded successfully!', 'success', downloadButton, 3000);
}

function handlePaperTypeChange() {
    const paperType = document.getElementById('paperType').value;
    const specialMidOptions = document.getElementById('specialMidOptions');
    
    if (paperType === 'special') {
        if (specialMidOptions) {
            specialMidOptions.style.display = 'block';
        }
    } else {
        if (specialMidOptions) {
            specialMidOptions.style.display = 'none';
        }
    }
}

function getCOValue(unit) {
    switch (unit) {
        case 1: return 'CO1';
        case 2: return 'CO2';
        case 3: return 'CO3';
        case 4: return 'CO4';
        case 5: return 'CO5';
        default: return '';
    }
}
