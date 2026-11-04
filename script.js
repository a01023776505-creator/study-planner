const subjectCheckboxes = document.querySelectorAll(
    'input[name="subject"]'
);

const subjectExamDates = document.getElementById("subjectExamDates");
const createPlanButton = document.getElementById("createPlanButton");
const result = document.getElementById("result");

let subjectDates = {};

/* 날짜를 YYYY-MM-DD 형식으로 변환 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

/* 날짜를 보기 좋은 형식으로 변환 */
function formatDateKorean(date) {
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

/* 날짜에 일수를 더하기 */
function addDays(date, days) {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);

    return newDate;
}

/* 선택된 과목 가져오기 */
function getSelectedSubjects() {
    return Array.from(subjectCheckboxes)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);
}

/* 시험 날짜 입력 칸 만들기 */
function updateExamDateInputs() {
    const selectedSubjects = getSelectedSubjects();

    subjectExamDates.innerHTML = "";

    selectedSubjects.forEach(subject => {
        const item = document.createElement("div");
        item.className = "exam-date-item";

        const label = document.createElement("label");
        label.textContent = `${subject} 시험 날짜`;

        const input = document.createElement("input");
        input.type = "date";
        input.required = true;
        input.value = subjectDates[subject] || "";

        input.addEventListener("change", () => {
            subjectDates[subject] = input.value;
        });

        label.appendChild(input);
        item.appendChild(label);
        subjectExamDates.appendChild(item);
    });
}

/* 과목 선택이 바뀌면 시험 날짜 입력 칸 갱신 */
subjectCheckboxes.forEach(checkbox => {
    checkbox.addEventListener("change", updateExamDateInputs);
});

/* 하루 공부 계획 배분 */
function distributeStudyTime(subjects, totalMinutes, currentDate) {
    const availableSubjects = subjects.filter(subject => {
        return subjectDates[subject] >= formatDate(currentDate);
    });

    if (availableSubjects.length === 0) {
        return [];
    }

    const weights = availableSubjects.map(subject => {
        const examDate = new Date(subjectDates[subject] + "T00:00:00");
        const daysLeft = Math.max(
            1,
            Math.ceil((examDate - currentDate) / (1000 * 60 * 60 * 24))
        );

        return 1 / daysLeft;
    });

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let allocatedMinutes = 0;

    return availableSubjects.map((subject, index) => {
        let minutes;

        if (index === availableSubjects.length - 1) {
            minutes = totalMinutes - allocatedMinutes;
        } else {
            minutes = Math.round(
                totalMinutes * weights[index] / totalWeight
            );

            allocatedMinutes += minutes;
        }

        return {
            subject: subject,
            minutes: Math.max(0, minutes)
        };
    });
}

/* 분을 시간과 분으로 표시 */
function formatMinutes(minutes) {
    if (minutes < 60) {
        return `${minutes}분`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours}시간`;
    }

    return `${hours}시간 ${remainingMinutes}분`;
}

/* 하루 칸 만들기 */
function createDayCell(date, subjects, totalMinutes) {
    const cell = document.createElement("td");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentDate = new Date(date);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate.getTime() === today.getTime()) {
        cell.classList.add("today");
    }

    const dateText = document.createElement("div");
    dateText.className = "day-date";
    dateText.textContent = formatDateKorean(date);

    cell.appendChild(dateText);

    const dateString = formatDate(date);

    const examSubjects = subjects.filter(subject => {
        return subjectDates[subject] === dateString;
    });

    const studyItems = distributeStudyTime(
        subjects,
        totalMinutes,
        date
    );

    if (studyItems.length === 0) {
        const noStudy = document.createElement("div");
        noStudy.className = "no-study";
        noStudy.textContent = "공부 계획 없음";

        cell.appendChild(noStudy);
    } else {
        studyItems.forEach(item => {
            const study = document.createElement("div");
            study.className = "day-study";

            const subjectName = document.createElement("strong");
            subjectName.textContent = item.subject;

            const studyTime = document.createElement("span");
            studyTime.textContent = formatMinutes(item.minutes);

            study.appendChild(subjectName);
            study.appendChild(studyTime);

            cell.appendChild(study);
        });
    }

    if (examSubjects.length > 0) {
        cell.classList.add("exam-day");

        examSubjects.forEach(subject => {
            const examLabel = document.createElement("span");
            examLabel.className = "exam-label";
            examLabel.textContent = `${subject} 시험`;

            cell.appendChild(examLabel);
        });
    }

    return cell;
}

/* 주간 표 만들기 */
function createWeekTable(weekStart, subjects, totalMinutes, weekNumber) {
    const weekCard = document.createElement("div");
    weekCard.className = "week-card";

    const weekEnd = addDays(weekStart, 6);

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";

    const title = document.createElement("h3");
    title.textContent = `${weekNumber}주차 공부 계획`;

    const dateRange = document.createElement("p");
    dateRange.textContent =
        `${formatDateKorean(weekStart)} ~ ${formatDateKorean(weekEnd)}`;

    weekHeader.appendChild(title);
    weekHeader.appendChild(dateRange);

    weekCard.appendChild(weekHeader);

    const tableWrap = document.createElement("div");
    tableWrap.className = "week-table-wrap";

    const table = document.createElement("table");
    table.className = "week-table";

    const days = ["월", "화", "수", "목", "금", "토", "일"];

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    days.forEach(day => {
        const th = document.createElement("th");
        th.textContent = day;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    const row = document.createElement("tr");

    for (let i = 0; i < 7; i++) {
        const currentDate = addDays(weekStart, i);

        const cell = createDayCell(
            currentDate,
            subjects,
            totalMinutes
        );

        row.appendChild(cell);
    }

    tbody.appendChild(row);
    table.appendChild(tbody);

    tableWrap.appendChild(table);
    weekCard.appendChild(tableWrap);

    return weekCard;
}

/* 공부 계획 생성 */
function createStudyPlan() {
    const grade = document.getElementById("grade").value;
    const major = document.getElementById("major").value.trim();
    const studyTime = Number(
        document.getElementById("studyTime").value
    );

    const selectedSubjects = getSelectedSubjects();

    if (!grade) {
        alert("학년을 선택해 주세요.");
        return;
    }

    if (!studyTime || studyTime <= 0) {
        alert("하루 공부 시간을 올바르게 입력해 주세요.");
        return;
    }

    if (selectedSubjects.length === 0) {
        alert("공부할 과목을 하나 이상 선택해 주세요.");
        return;
    }

    for (const subject of selectedSubjects) {
        if (!subjectDates[subject]) {
            alert(`${subject}의 시험 날짜를 입력해 주세요.`);
            return;
        }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDates = selectedSubjects.map(subject => {
        return new Date(subjectDates[subject] + "T00:00:00");
    });

    const latestExamDate = new Date(
        Math.max(...examDates.map(date => date.getTime()))
    );

    if (latestExamDate < today) {
        alert("시험 날짜가 모두 오늘보다 이전입니다. 날짜를 확인해 주세요.");
        return;
    }

    result.innerHTML = "";

    const summary = document.createElement("div");
    summary.className = "plan-summary";

    summary.innerHTML = `
        <strong>학년:</strong> ${grade}<br>
        <strong>희망 학과:</strong> ${major || "입력하지 않음"}<br>
        <strong>하루 공부 시간:</strong> ${formatMinutes(studyTime * 60)}<br>
        <strong>선택 과목:</strong> ${selectedSubjects.join(", ")}
    `;

    result.appendChild(summary);

    /*
      월요일을 한 주의 시작으로 계산
      오늘이 일요일이면 해당 일요일부터 표를 시작함
    */
    const firstDay = new Date(today);
    const dayOfWeek = firstDay.getDay();

    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    firstDay.setDate(firstDay.getDate() - daysSinceMonday);

    let weekNumber = 1;
    let weekStart = new Date(firstDay);

    while (weekStart <= latestExamDate) {
        const weekCard = createWeekTable(
            weekStart,
            selectedSubjects,
            studyTime * 60,
            weekNumber
        );

        result.appendChild(weekCard);

        weekStart = addDays(weekStart, 7);
        weekNumber++;
    }
}

/* 버튼 클릭 시 계획 생성 */
createPlanButton.addEventListener("click", createStudyPlan);

/* 처음 화면의 시험 날짜 입력 칸 초기화 */
updateExamDateInputs();
