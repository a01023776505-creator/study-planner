function createPlan() {
    const grade = document.getElementById("grade").value;
    const examDate = document.getElementById("examDate").value;
    const studyTime = Number(document.getElementById("studyTime").value);
    const majorInput = document.getElementById("major");
    const major = majorInput ? majorInput.value.trim() : "";

    const checkboxes = document.querySelectorAll(
        'input[name="subject"]:checked'
    );

    const subjects = Array.from(checkboxes).map(
        checkbox => checkbox.value
    );

    const result = document.getElementById("result");

    // 입력 확인
    if (examDate === "") {
        result.textContent = "시험 날짜를 선택해 주세요.";
        return;
    }

    if (studyTime <= 0 || studyTime > 24) {
        result.textContent = "하루 공부 시간을 1~24시간으로 입력해 주세요.";
        return;
    }

    if (subjects.length === 0) {
        result.textContent = "공부할 과목을 하나 이상 선택해 주세요.";
        return;
    }

    // 날짜 계산
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exam = new Date(examDate + "T00:00:00");

    const remainingDays = Math.ceil(
        (exam - today) / (1000 * 60 * 60 * 24)
    );

    if (remainingDays < 0) {
        result.textContent = "시험 날짜가 이미 지났습니다.";
        return;
    }

    // 하루 공부 시간(분)
    const dailyMinutes = Math.round(studyTime * 60);

    // 과목별 시간 배분
    function divideTime(selectedSubjects, totalMinutes) {
        const base = Math.floor(
            totalMinutes / selectedSubjects.length
        );

        const extra = totalMinutes % selectedSubjects.length;

        return selectedSubjects.map((subject, index) => ({
            subject: subject,
            minutes: base + (index < extra ? 1 : 0)
        }));
    }

    // 분을 시간과 분으로 표시
    function formatTime(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        if (hours > 0 && mins > 0) {
            return `${hours}시간 ${mins}분`;
        }

        if (hours > 0) {
            return `${hours}시간`;
        }

        return `${mins}분`;
    }

    // 사용자 입력을 HTML에 안전하게 표시
    function escapeHTML(text) {
        return String(text).replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    // 날짜 표시
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // 계획표 시작
    let plan = `
        <h2>시험 대비 학습 스케줄</h2>

        <p><strong>학년:</strong> ${escapeHTML(grade)}</p>
        ${major ? `<p><strong>희망 학과:</strong> ${escapeHTML(major)}</p>` : ""}
        <p><strong>시험 날짜:</strong> ${examDate}</p>
        <p><strong>시험까지:</strong> ${remainingDays}일</p>
        <p><strong>하루 공부 시간:</strong> ${formatTime(dailyMinutes)}</p>

        <h3>날짜별 공부 계획</h3>
    `;

    // 시험일까지 날짜별 스케줄 생성
    for (let day = 0; day <= remainingDays; day++) {
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + day);

        const daysLeft = remainingDays - day;

        let dailySubjects = [...subjects];
        let studyMinutes = dailyMinutes;
        let message = "개념 학습과 문제 풀이";

        // 시험 전날은 복습과 오답 정리 중심
        if (daysLeft === 1) {
            message = "핵심 개념 복습과 오답 정리";
        } else if (daysLeft === 0) {
            message = "가벼운 핵심 내용 복습";
            studyMinutes = Math.round(dailyMinutes * 0.5);
        } else if (daysLeft <= 3) {
            message = "기출·유형 문제와 오답 복습";
        }

        // 과목을 날짜마다 순환하여 배치
        const shift = day % dailySubjects.length;

        dailySubjects = dailySubjects
            .slice(shift)
            .concat(dailySubjects.slice(0, shift));

        const subjectPlans = divideTime(
            dailySubjects,
            studyMinutes
        );

        plan += `
            <div style="
                border:1px solid #ddd;
                border-radius:10px;
                padding:15px;
                margin:15px 0;
                background:#f9faff;
            ">
                <h3>${formatDate(currentDate)}</h3>
                <p><strong>D-${daysLeft}</strong></p>
                <p>${message}</p>

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    text-align:center;
                ">
                    <tr style="background:#4169e1;color:white;">
                        <th style="padding:8px;">과목</th>
                        <th style="padding:8px;">공부 시간</th>
                    </tr>
        `;

        subjectPlans.forEach(item => {
            plan += `
                <tr>
                    <td style="padding:8px;border-bottom:1px solid #ddd;">
                        ${escapeHTML(item.subject)}
                    </td>
                    <td style="padding:8px;border-bottom:1px solid #ddd;">
                        ${formatTime(item.minutes)}
                    </td>
                </tr>
            `;
        });

        plan += `
                </table>
            </div>
        `;
    }

    plan += `
        <p style="margin-top:20px;">
            계획은 참고용이며, 공부 진행 상황에 따라 조정해 보세요!
        </p>
    `;
// 선택한 과목마다 시험 날짜 입력란 생성
function updateSubjectExamDates() {
    const checkboxes = document.querySelectorAll(
        'input[name="subject"]:checked'
    );

    const container = document.getElementById("subjectExamDates");

    if (!container) return;

    const selectedSubjects = Array.from(checkboxes).map(
        checkbox => checkbox.value
    );

    // 기존 날짜 입력값 저장
    const previousDates = {};

    container.querySelectorAll("input").forEach(input => {
        previousDates[input.dataset.subject] = input.value;
    });

    container.innerHTML = "";

    selectedSubjects.forEach(subject => {
        const row = document.createElement("div");

        row.style.margin = "10px 0";

        const label = document.createElement("label");
        label.textContent = subject + " 시험 날짜: ";

        const input = document.createElement("input");
        input.type = "date";
        input.dataset.subject = subject;
        input.required = true;

        // 이미 입력한 날짜가 있다면 유지
        input.value = previousDates[subject] || "";

        label.appendChild(input);
        row.appendChild(label);
        container.appendChild(row);
    });
}

// 과목 선택이 바뀔 때 날짜 입력란 갱신
document.querySelectorAll('input[name="subject"]').forEach(checkbox => {
    checkbox.addEventListener("change", updateSubjectExamDates);
});

// 처음 사이트를 열었을 때도 실행
updateSubjectExamDates();
    result.innerHTML = plan;
}
