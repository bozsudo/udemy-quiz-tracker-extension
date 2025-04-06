document.getElementById('export-btn').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: exportQuizData
            });
        } else {
            console.error("No active tab found.");
        }
    });
});


function exportQuizData() {
    const data = localStorage.getItem("udemy_quiz_tracker");
    if (data) {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "udemy-quiz-data.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        console.error("No quiz data found in localStorage.");
    }
}
