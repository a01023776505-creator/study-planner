
function createPlan() {
    const grade = document.getElementById("grade").value;
    const studyTime = Number(document.getElementById("studyTime").value);

    const majorInput = document.getElementById("major");
    const major = majorInput ? majorInput.value.trim() : "";

    const result = document.getElementById("result");

    // 선택한 세부 과목 가져오기
    const checkboxes = document.querySelectorAll(
        'input[name="subject"]:checked'
    );

    const subjects = Array.from(checkboxes).map(
        checkbox => checkbox.value
    );

    // 입력 확인
    if (subjects.length === 0) {
        result.textContent = "공부할 과목을 하나 이상 선택해 주세요.";
        return;
    }

    if (studyTime <= 0 || studyTime > 24) {
        result.textContent = "하루 공부 시간을 1~24시간으로 입력해 주세요.";
        return;
    }

    // 과목별 시험 날짜 가져오기
    const dateInputs = document.querySelectorAll(
        "#subjectExamDates input[type='date']"
    );

    const examDates = {};

    dateInputs.forEach(input => {
        examDates[input.dataset.subject] = input.value;
    });

    // 모든 과목의 시험 날짜 입력 확인
    for (const subject of subjects) {
        if (!examDates[subject]) {
            result.textContent =
                `${subject}의 시험 날짜를 선택해 주세요.`;
            return;
        }
    }

    // 오늘 날짜 설정
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 과목별 날짜를 Date 객체로 변환
    const parsedExamDates = {};

    for (const subject of subjects) {
        const examDate = new Date(
            examDates[subject] + "T00:00:00"
        );

        if (Number.isNaN(examDate.getTime())) {
            result.textContent =
                `${subject}의 시험 날짜가 올바르지 않습니다.`;
            return;
        }

        if (examDate < today) {
            result.textContent =
                `${subject}의 시험 날짜가 이미 지났습니다.`;
            return;
        }

        parsedExamDates[subject] = examDate;
    }

    // 가장 늦은 시험 날짜 찾기
    const lastExamDate = new Date(
        Math.max(
            ...Object.values(parsedExamDates).map(
                date => date.getTime()
            )
        )
    );

    // 전체 시험 기간 계산
    const totalDays = Math.round(
        (lastExamDate - today) / (1000 * 60 * 60 * 24)
    );

    const dailyMinutes = Math.round(studyTime * 60);

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

    // 날짜 표시
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    // HTML에 안전하게 표시
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

    // 계획표 시작
    let plan = `
        <h2>시험 대비 학습 스케줄</h2>

        <p><strong>학년:</strong> ${escapeHTML(grade)}</p>

        ${
            major
                ? `<p><strong>희망 학과:</strong> ${escapeHTML(major)}</p>`
                : ""
        }

        <p>
            <strong>하루 공부 가능 시간:</strong>
            ${formatTime(dailyMinutes)}
        </p>

        <p>
            <strong>전체 시험 기간:</strong>
            ${formatDate(today)} ~ ${formatDate(lastExamDate)}
        </p>

        <h3>과목별 시험 일정</h3>
    `;

    // 과목별 시험 날짜 표시
    subjects.forEach(subject => {
        plan += `
            <p>
                ${escapeHTML(subject)}:
                ${formatDate(parsedExamDates[subject])}
            </p>
        `;
    });

    plan += `
        <h3>날짜별 공부 계획</h3>
    `;

    // 날짜별 스케줄 생성
    for (let day = 0; day <= totalDays; day++) {
        const currentDate = new Date(today);

        currentDate.setDate(today.getDate() + day);

        // 오늘을 기준으로 시험까지 남은 날짜 계산
        const daysLeft = totalDays - day;

        // 아직 시험이 끝나지 않은 과목
        const activeSubjects = subjects.filter(subject => {
            return parsedExamDates[subject] >= currentDate;
        });

        // 오늘 시험을 보는 과목
        const todaySubjects = activeSubjects.filter(subject => {
            return (
                parsedExamDates[subject].getTime() ===
                currentDate.getTime()
            );
        });

        // 오늘 이후 시험이 남아 있는 과목
        const studySubjects = activeSubjects.filter(subject => {
            return parsedExamDates[subject] > currentDate;
        });

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
        `;

        // 오늘 시험이 있는 과목 표시
        if (todaySubjects.length > 0) {
            plan += `
                <p>
                    <strong>오늘 시험:</strong>
                    ${todaySubjects.map(escapeHTML).join(", ")}
                </p>
                <p>시험 당일에는 무리한 공부보다 가벼운 복습을 권장합니다.</p>
            `;
        }

        // 모든 시험이 끝났을 때
        if (activeSubjects.length === 0) {
            plan += `
                <p>모든 시험이 끝났습니다!</p>
            </div>
            `;

            continue;
        }

        // 오늘 시험만 있고 앞으로 남은 시험이 없을 때
        if (studySubjects.length === 0) {
            plan += `
                <p>오늘 시험을 마치면 모든 시험이 끝납니다.</p>
            </div>
            `;

            continue;
        }

        // 시험이 가까운 과목일수록 가중치를 높임
        const weights = studySubjects.map(subject => {
            const subjectDaysLeft = Math.round(
                (parsedExamDates[subject] - currentDate) /
                (1000 * 60 * 60 * 24)
            );

            return 1 / (subjectDaysLeft + 1);
        });

        const totalWeight = weights.reduce(
            (sum, weight) => sum + weight,
            0
        );

        // 시험 당일이 있으면 공부 시간을 조금 줄임
        const availableMinutes = todaySubjects.length > 0
            ? Math.round(dailyMinutes * 0.7)
            : dailyMinutes;

        // 과목별 시간 배분
        const subjectPlans = [];

        let allocatedMinutes = 0;

        studySubjects.forEach((subject, index) => {
            const minutes = Math.floor(
                availableMinutes *
                weights[index] /
                totalWeight
            );

            allocatedMinutes += minutes;

            subjectPlans.push({
                subject: subject,
                minutes: minutes,
                daysLeft: Math.round(
                    (parsedExamDates[subject] - currentDate) /
                    (1000 * 60 * 60 * 24)
                )
            });
        });

        // 남는 시간을 마지막 과목에 더함
        if (subjectPlans.length > 0) {
            subjectPlans[subjectPlans.length - 1].minutes +=
                availableMinutes - allocatedMinutes;
        }

        // 공부 방법 안내
        if (daysLeft <= 1) {
            plan += `
                <p>
                    <strong>학습 방법:</strong>
                    핵심 개념 복습과 오답 정리
                </p>
            `;
        } else if (daysLeft <= 3) {
            plan += `
                <p>
                    <strong>학습 방법:</strong>
                    유형 문제 풀이와 오답 복습
                </p>
            `;
        } else {
            plan += `
                <p>
                    <strong>학습 방법:</strong>
                    개념 학습과 문제 풀이
                </p>
            `;
        }

        // 공부 계획표
        plan += `
            <table style="
                width:100%;
                border-collapse:collapse;
                text-align:center;
            ">
                <tr style="background:#4169e1;color:white;">
                    <th style="padding:8px;">과목</th>
                    <th style="padding:8px;">시험까지</th>
                    <th style="padding:8px;">공부 시간</th>
                </tr>
        `;

        subjectPlans.forEach(item => {
            plan += `
                <tr>
                    <td style="
                        padding:8px;
                        border-bottom:1px solid #ddd;
                    ">
                        ${escapeHTML(item.subject)}
                    </td>

                    <td style="
                        padding:8px;
                        border-bottom:1px solid #ddd;
                    ">
                        D-${item.daysLeft}
                    </td>

                    <td style="
                        padding:8px;
                        border-bottom:1px solid #ddd;
                    ">
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
            시험이 끝난 과목은 이후 계획에서 제외됩니다.
            실제 공부 상황에 맞게 계획을 조정해 보세요!
        </p>
    `;

    // 결과 표시
    result.innerHTML = plan;
}


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

    // 기존에 입력한 시험 날짜 저장
    const previousDates = {};

    container.querySelectorAll("input").forEach(input => {
        previousDates[input.dataset.subject] = input.value;
    });

    // 날짜 입력란 초기화
    container.innerHTML = "";

    // 선택된 과목마다 날짜 입력란 생성
    selectedSubjects.forEach(subject => {
        const row = document.createElement("div");

        row.style.margin = "10px 0";

        const label = document.createElement("label");

        label.textContent = subject + " 시험 날짜: ";

        const input = document.createElement("input");

        input.type = "date";
        input.dataset.subject = subject;
        input.required = true;

        // 이전에 입력한 날짜 유지
        input.value = previousDates[subject] || "";

        label.appendChild(input);

        row.appendChild(label);

        container.appendChild(row);
    });
}


// 과목 선택이 바뀌면 시험 날짜 입력란 갱신
document.querySelectorAll('input[name="subject"]').forEach(checkbox => {
    checkbox.addEventListener("change", updateSubjectExamDates);
});


// 사이트를 처음 열었을 때 실행
updateSubjectExamDates();
