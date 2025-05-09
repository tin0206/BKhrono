import { Class, SchedulePriority } from "./types";
//Arrays to be processed further
export const course_ids: string[] = []; // Used to setCourses in SideBar
export const subjectNames: string[] = [] // Used to setCourses in SideBar
export const classes_nonlab: Class[] = [];
export const classes_lab: Class[] = [];

const formattingInput = (data: string) => {
	const courses: string[] = data.split('Lịch đăng ký')
	courses.shift()
	courses.forEach((course, index) => {
		if (course.includes('ĐĂNG KÝ MÔN HỌC')) {
			const indexOfKeyword = course.indexOf('ĐĂNG KÝ MÔN HỌC')
			course = course.slice(0, indexOfKeyword)
		}
		let i = course.indexOf('Chọn môn học đăng ký')
		course = course.slice(i)
		i = course.indexOf('Phiếu đăng ký')
		courses[index] = course.slice(0, i)
	})

	return courses
}

export const getClassesList = (data: string) => {
	const finalClasses: string[] = []
	const courses: string[] = formattingInput(data)
	courses.forEach((course) => {
		const index = course.indexOf('Chọn môn học đăng ký')
		const course_id = course.slice(index + 21, index + 27).toUpperCase()
		if (course_ids.includes(course_id)) return // Early return if the course is already in the array
		subjectNames.push(course.slice(index + 79).split(/\t\d/)[0].trim());
		const splitData = course.split('Sĩ số LT	#\n')
		const data: string = splitData[1] || ''
		const str: string = data
		if (course.includes('_')) {
			// Extract all subclasses from str (e.g., CC01_CC02, CC02_CC03)
			const subclassMatches = str.match(/CC\d{2}_CC\d{2}/g) || [];

			subclassMatches.forEach((subclass) => {

				// Isolate the part of str specific to this subclass
				const subclassStartIndex = str.indexOf(subclass);
				const regex = /(CC|DT|DTQ|L|CN|TN)\d{2}/g; // Match any of the keywords
				const searchArea = str.slice(subclassStartIndex + 61); // Narrow the search area

				const match = searchArea.match(regex);

				const subclassEndIndex = match ? str.indexOf(match[0], subclassStartIndex + 59) : str.length;


				const subclassStr = str.slice(subclassStartIndex, subclassEndIndex);

				// Process this subclass with getClassLab
				finalClasses.push(getClassLab(subclassStr, course_id));
			});
		}
			
		else {
			const regex = /CC\d{2}/g
			const matches = [...str.matchAll(regex)]
			const classes = matches.filter((_, i) => i % 2 == 0)
			classes.forEach((subclass, i) => {
				finalClasses.push(getClassNonLab(subclass, i, classes, course_id))
			})
		}
	})
	return finalClasses;
}

const getClassNonLab = (subclass: RegExpMatchArray, index: number, classes: RegExpMatchArray[], subject: string) => {
    let temp : string
    const inputStr = subclass.input || ''
    const indexStart = subclass.index || 0
    if (index == classes.length - 1) {
			const indexOfCN = inputStr.indexOf('CN', indexStart)
			const indexOfDT = inputStr.indexOf('DT', indexStart)
			const indexOfDTQ = inputStr.indexOf('DTQ', indexStart)
			const indexOfL = inputStr.indexOf('L', indexStart)
			const indexOfTN = inputStr.indexOf('TN', indexStart)

			const endIndex =
					indexOfCN != -1 ? indexOfCN :
					indexOfDT != -1 ? indexOfDT :
					indexOfDTQ != -1 ? indexOfDTQ :
					indexOfL != -1 ? indexOfL :
					indexOfTN != -1 ? indexOfTN :
					inputStr.length

			temp = inputStr.slice(indexStart, endIndex)
    }
    else {
			const nextMatch = classes[index + 1]
			const nextIndexStart = nextMatch && nextMatch.index != undefined ? nextMatch.index : inputStr.length
			const length = nextIndexStart - indexStart;
			temp = inputStr.slice(indexStart, indexStart + length)
    }
    const groupClass = subclass[0]
    temp = temp.slice(5)
    const indexOfTab = temp.indexOf('\t')
    const numberStudent = temp.slice(0, indexOfTab)
	
	if (temp.includes('V')) {
		temp = temp.slice(indexOfTab + 53)
	}
	else {
		temp = temp.slice(indexOfTab + 54)
	}
	
    const day = temp.slice(0, 1)
    temp = temp.slice(2)
    let time = '['
    let learningTime = ''
    const indexOfA = temp.indexOf('A')
    const indexOfB = temp.indexOf('B')
    const indexOfC = temp.indexOf('C')
    if (indexOfA != -1) {
        learningTime = temp.slice(0, indexOfA - 1)
        temp = temp.slice(indexOfA)
    }
    else if (indexOfB != -1) {
        learningTime = temp.slice(0, indexOfB - 1)
        temp = temp.slice(indexOfB)
    }   
    else if (indexOfC != -1) {
        learningTime = temp.slice(0, indexOfC - 1)
        temp = temp.slice(indexOfC)
    }
    const numbers = learningTime.split(' ').filter(num => num != '-').map(Number)
    const result = [numbers[0], numbers[numbers.length - 1]]
    time += result.toString() + ']'
    const indexOfDash = temp.indexOf('-')
    const room = temp.slice(0, indexOfDash + 4)
		
    return subject + ' ' + groupClass + ' ' + numberStudent + ' ' + day + ' ' + time + ' ' + room
}

const getClassLab = (subclassStr: string, subject: string): string => {
	// Extract the main and lab class codes
	const matchResult = subclassStr.match(/CC\d{2}_CC\d{2}/);
	const [mainClass, labClass] = matchResult?.[0].split("_") ?? ["Unknown", "Unknown"];

	// Extract the entire "40/40" string for student count
	const studentsMatch = subclassStr.match(/\d{1,3}\/\d{1,3}/);
	const studentsString = studentsMatch ? studentsMatch[0] : "Unknown";

	// Match time blocks, days, and rooms
	const timeBlocks = subclassStr.match(/Thứ \d+\s+[-\d\s]+/g) || ["nah"];

	const days = subclassStr.match(/Thứ (\d+)/g) || [];
	const rooms = subclassStr.match(/[A-Z]\d-\d+/g) || [];

	// default set up: main is above and lab is below => [0: 'main', 1:'lab']
	let swap = 1;

	// Determine the main and lab classes based on time durations
	if (timeBlocks[0].split(" ").filter((x) => x !== "-").length < timeBlocks[1].split(" ").filter((x) => x !== "-").length) 
	{

		swap = 0;
	}

	// Parse main class details
	const mainDay = days[swap? 1:0]?.split(" ")[1] || "Unknown";
	const mainTimes = timeBlocks[swap? 1:0]?.split(" ").filter((x) => x !== "-").map(Number) || [];
	const mainTimeRange = mainTimes.length? `[${mainTimes[2]},${mainTimes[mainTimes.length - 2]}]`: "Unknown";
	const mainRoom = rooms[swap? 1:0] || "Unknown";

	// Parse lab class details
	const labDay = days[swap? 0:1]?.split(" ")[1] || "Unknown";
	const labTimes = timeBlocks[swap? 0:1]?.split(" ").filter((x) => x !== "-").map(Number) || [];
	const labTimeRange = labTimes.length? `[${labTimes[2]},${labTimes[labTimes.length - 2]}]`: "Unknown";
	const labRoom = rooms[swap? 0:1] || "Unknown";

	// Return formatted string
	return `${subject} ${mainClass} ${studentsString} ${mainDay} ${mainTimeRange} ${mainRoom} ${labClass} ${labDay} ${labTimeRange} ${labRoom}`;
};


export const parseClassString = (classStr: string): Class[] => {
	const parts = classStr.split(" ");
	if (parts.length === 6) {
		// Non-lab class format
		const [course_id, classCode, students, day, time, room] = parts;
		const [current_quantity, max_quantity] = students.split("/").map(Number);
		const date = parseInt(day.replace("Thứ", ""), 10);
		const timeRange = time.slice(1, -1).split(",").map(Number);

		return [
			{
				type: "non-lab",
				course_id,
				class: classCode,
				current_quantity,
				max_quantity,
				date,
				time: timeRange,
				room,
			},
		];
	} else if (parts.length === 10) {
		// Lab class format
		const [
			course_id,
			classCode,
			students,
			mainDay,
			mainTime,
			room,
			class_lab,
			labDay,
			labTime,
			room_lab,
		] = parts;
		const [currentStudents, maxStudents] = students.split("/").map(Number);
		const mainDayNumber = parseInt(mainDay.replace("Thứ", ""), 10);
		const mainTimeRange = mainTime.slice(1, -1).split(",").map(Number);
		const labDayNumber = parseInt(labDay.replace("Thứ", ""), 10);
		const labTimeRange = labTime.slice(1, -1).split(",").map(Number);

		return [
			{
				type: "lab",
				course_id,
				class: classCode,
				current_quantity: currentStudents,
				max_quantity: maxStudents,
				date: mainDayNumber,
				time: mainTimeRange,
				room,
				class_lab,
				date_lab: labDayNumber,
				time_lab: labTimeRange,
				room_lab,
			},
		];
	}
	return []; // Return an empty array for unexpected formats
};



function shuffleArray<T>(array: T[]): T[] {
	return array
		.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);
}

// Example: schedulePriority = {
//   monday: [2, 3, 4, 5], // times from 7-8h => 2, 8-9h => 3, etc.
//   tuesday: [7, 6, 5, 4, 3, 2],
//   wednesday: [],
//   thursday: [],
//   friday: [],
//   saturday: []
// };
export function prioritizeClasses(classes: Class[], schedulePriority: SchedulePriority): Class[] {
  // Map numeric day values to schedulePriority keys.
  const dayKeys: { [key: number]: keyof SchedulePriority } = {
    2: "monday",
    3: "tuesday",
    4: "wednesday",
    5: "thursday",
    6: "friday",
    7: "saturday",
  };

  return classes.sort((a, b) => {
    // Determine day keys and day indices (Monday=0, Tuesday=1, etc.)
    const dayAKey = dayKeys[a.date] || "monday"; // fallback if missing
    const dayBKey = dayKeys[b.date] || "monday";
    const dayIndexA = a.date - 2;
    const dayIndexB = b.date - 2;

    // Look up the start time (first element) in the schedulePriority array.
    // If the start time isn't found, assign Infinity (i.e. very low priority).
    const timePriorityA = schedulePriority[dayAKey].indexOf(a.time[0]);
    const timePriorityB = schedulePriority[dayBKey].indexOf(b.time[0]);
    const finalTimeA = timePriorityA === -1 ? Infinity : timePriorityA;
    const finalTimeB = timePriorityB === -1 ? Infinity : timePriorityB;

    // Combine the day and time priorities into one overall priority.
    // Multiplying day index by 100 gives days a heavier weight.
    const overallPriorityA = dayIndexA * 100 + finalTimeA;
    const overallPriorityB = dayIndexB * 100 + finalTimeB;

    return overallPriorityA - overallPriorityB;
  });
}

export const getClassesFromCourse = (course_id: string, classes: Class[], schedulePriority: SchedulePriority): Class[] => {
	const filteredClasses = classes.filter((cls) => cls.course_id === course_id);
	const shuffledClasses = shuffleArray(filteredClasses);
	const prioritizedClasses = prioritizeClasses(shuffledClasses, schedulePriority);
	// console.log(prioritizedClasses);
	return prioritizedClasses;
}

export const fillClasses = (schedule: string[][], classes: Class[]): void => {
	for (const cls of classes) {
		// Deep copy the schedule
		const temp_schedule = schedule.map(row => [...row]);

		const { type, course_id, class: classID, date, time, class_lab, date_lab, time_lab } = cls;
		const [start, end] = time;
		const [start_lab, end_lab] = time_lab || [0, 0];

		let isOccupied = false;

		const colIndex = date - 2;
		const colIndexLab = (date_lab || -1) - 2;

		// Check conflicts for main class
		for (let i = start; i <= end; i++) {
			if (temp_schedule[i - 2][colIndex] !== "-1") {
				console.warn(`Conflict at ${i}, ${colIndex} for class ${course_id}`);
				isOccupied = true;
				break;
			}
		}

		// Check conflicts for lab class
		if (!isOccupied && type === "lab") {
			for (let i = start_lab; i <= end_lab; i++) {
				if (temp_schedule[i - 2][colIndexLab] !== "-1") {
					console.warn(`Conflict at ${i}, ${colIndexLab} for lab ${course_id}`);
					isOccupied = true;
					break;
				}
			}
		}

		if (!isOccupied) {
			// Fill main class
			for (let i = start; i <= end; i++) {
				temp_schedule[i - 2][colIndex] = (i === start) ? course_id : classID;
			}

			// Fill lab class
			if (type === "lab") {
				for (let i = start_lab; i <= end_lab; i++) {
					temp_schedule[i - 2][colIndexLab] = (i === start_lab) ? course_id : (class_lab || "");
				}
			}

			// Commit changes to the original schedule
			for (let i = 0; i < schedule.length; i++) {
				for (let j = 0; j < schedule[i].length; j++) {
					schedule[i][j] = temp_schedule[i][j];
				}
			}

			break;
		}
	}
};

