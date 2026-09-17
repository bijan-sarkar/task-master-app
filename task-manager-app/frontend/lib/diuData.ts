// Comprehensive DIU (Daffodil International University) course catalog,
// past exam questions, topic priority matrices, and prerequisite survival guides.

export interface DIUPrerequisiteConcept {
  concept: string;
  importance: string;
  summary: string;
}

export interface DIUPrerequisitesGuide {
  title: string;
  foundational_concepts: DIUPrerequisiteConcept[];
  diu_a_plus_strategy: string[];
  common_pitfalls: string[];
  recommended_resources: string[];
}

export interface DIUTopicItem {
  id: string;
  name: string;
  exam_term: 'midterm' | 'final';
  priority_stars: number; // 1 to 5
  priority_label: 'Critical (Guaranteed)' | 'High Priority' | 'Medium Priority' | 'Low Priority';
  importance_score: number; // 0 to 100
  repeat_frequency: string;
  marks_weightage: string;
  expected_question_types: ('Code Writing' | 'Dry Run' | 'Differences' | 'Theory' | 'Mathematical' | 'Diagram')[];
  description: string;
  status: 'pending' | 'learning' | 'mastered';
}

export interface DIUPastQuestionItem {
  id: string;
  course_code: string;
  exam_term: 'midterm' | 'final';
  exam_session: string; // e.g. "Fall 2024", "Spring 2024"
  question_type: 'code' | 'dry_run' | 'theory' | 'difference' | 'math' | 'diagram';
  question_text: string;
  marks: number;
  topic_name: string;
  solution_hints: string;
  practiced?: boolean;
}

export interface DIUCourseItem {
  id: string;
  code: string;
  name: string;
  credits: string;
  department: string;
  description: string;
  target_grade?: string;
  prerequisites_guide: DIUPrerequisitesGuide;
  midterm_topics: DIUTopicItem[];
  final_topics: DIUTopicItem[];
  past_questions: DIUPastQuestionItem[];
}

export interface DIUSemesterPreset {
  semester_number: number;
  title: string;
  level_term: string;
  recommended_courses: { code: string; name: string; credits: string }[];
}

export const DIU_SEMESTER_PRESETS: Record<string, DIUSemesterPreset[]> = {
  CSE: [
    {
      semester_number: 1,
      title: "Semester 1",
      level_term: "Level 1 Term 1",
      recommended_courses: [
        { code: "CSE112", name: "Computer Fundamentals & Programming", credits: "3.0" },
        { code: "MAT101", name: "Mathematics I (Calculus & Analytical Geometry)", credits: "3.0" },
        { code: "PHY101", name: "Physics I (Mechanics, Waves & Thermodynamics)", credits: "3.0" },
        { code: "ENG101", name: "English I (Basic English Language Skills)", credits: "3.0" }
      ]
    },
    {
      semester_number: 2,
      title: "Semester 2",
      level_term: "Level 1 Term 2",
      recommended_courses: [
        { code: "CSE122", name: "Structured Programming Language (C)", credits: "3.0" },
        { code: "CSE123", name: "Discrete Mathematics", credits: "3.0" },
        { code: "MAT102", name: "Mathematics II (Linear Algebra & Coordinate Geometry)", credits: "3.0" },
        { code: "PHY102", name: "Physics II (Electricity & Magnetism)", credits: "3.0" }
      ]
    },
    {
      semester_number: 3,
      title: "Semester 3",
      level_term: "Level 2 Term 1",
      recommended_courses: [
        { code: "CSE213", name: "Object Oriented Programming (Java/C++)", credits: "3.0" },
        { code: "CSE221", name: "Data Structures", credits: "3.0" },
        { code: "MAT201", name: "Complex Variables & Fourier Analysis", credits: "3.0" },
        { code: "STA101", name: "Basic Statistics & Probability", credits: "3.0" }
      ]
    },
    {
      semester_number: 4,
      title: "Semester 4",
      level_term: "Level 2 Term 2",
      recommended_courses: [
        { code: "CSE222", name: "Algorithms", credits: "3.0" },
        { code: "CSE223", name: "Digital Logic Design (DLD)", credits: "3.0" },
        { code: "CSE224", name: "Theory of Computation & Automata", credits: "3.0" },
        { code: "ACT101", name: "Financial & Managerial Accounting", credits: "3.0" }
      ]
    },
    {
      semester_number: 5,
      title: "Semester 5",
      level_term: "Level 3 Term 1",
      recommended_courses: [
        { code: "CSE311", name: "Database Management Systems (DBMS)", credits: "3.0" },
        { code: "CSE312", name: "Microprocessor & Assembly Language", credits: "3.0" },
        { code: "CSE313", name: "Computer Networks", credits: "3.0" },
        { code: "CSE314", name: "Numerical Methods", credits: "3.0" }
      ]
    },
    {
      semester_number: 6,
      title: "Semester 6",
      level_term: "Level 3 Term 2",
      recommended_courses: [
        { code: "CSE321", name: "Software Engineering & System Design", credits: "3.0" },
        { code: "CSE322", name: "Operating Systems", credits: "3.0" },
        { code: "CSE323", name: "Web Engineering", credits: "3.0" },
        { code: "CSE324", name: "Artificial Intelligence", credits: "3.0" }
      ]
    }
  ]
};

export const DIU_COURSE_CATALOG: Record<string, DIUCourseItem> = {
  CSE221: {
    id: "catalog-cse221",
    code: "CSE221",
    name: "Data Structures",
    credits: "3.0",
    department: "CSE",
    description: "Fundamental computer science course covering linear and non-linear data structures, pointer arithmetic, memory management, and asymptotic efficiency.",
    prerequisites_guide: {
      title: "Data Structures - Survival & A+ Blueprint",
      foundational_concepts: [
        {
          concept: "Pointers & Dynamic Memory Allocation in C/C++",
          importance: "Critical (Without this, Linked Lists, Trees, and Heaps are impossible)",
          summary: "Must understand pointer dereferencing (*p), address-of (&x), dynamic allocation with malloc()/free() or new/delete, and struct pointer member access (ptr->next)."
        },
        {
          concept: "Recursion & Call Stack Execution",
          importance: "Critical (Essential for Tree traversals, QuickSort, and Divide & Conquer)",
          summary: "Understand base cases, recursive steps, memory usage on call stack, and tracing recursive return values line-by-line."
        },
        {
          concept: "Structures (struct) & User-Defined Data Types",
          importance: "High",
          summary: "Creating node structures: struct Node { int data; struct Node* next; }; and self-referential structures."
        },
        {
          concept: "Asymptotic Notation & Time Complexity Basics",
          importance: "High",
          summary: "Big-O, Big-Omega, Big-Theta, comparing O(1), O(log n), O(n), O(n log n), O(n^2)."
        }
      ],
      diu_a_plus_strategy: [
        "Always write clean C/C++ syntax with null checks (e.g. if (head == NULL)) in code writing questions — DIU teachers deduct 2-3 marks for missing boundary checks.",
        "In Dry Run / Output Trace questions, ALWAYS draw memory boxes and pointer arrow reassignments step-by-step to earn full step marks.",
        "For Midterm, Linked Lists (Singly, Doubly, Circular) and Stack applications (Infix to Postfix) are guaranteed 15-20 marks combined.",
        "For Final, AVL tree rotation steps and BFS/DFS graph traversals are guaranteed 15-20 marks."
      ],
      common_pitfalls: [
        "Memory leak or dangling pointers by forgetting free(temp) when deleting nodes.",
        "Losing the head pointer of a linked list by moving head directly without using a temporary pointer.",
        "Messing up operator precedence in Infix-to-Postfix conversion (especially ^ vs * / vs + -).",
        "Drawing AVL rotations incorrectly by miscalculating Balance Factor (BF = Height_Left - Height_Right)."
      ],
      recommended_resources: [
        "Abdul Bari - Data Structures & Algorithms Playlist (YouTube)",
        "Jenny's Lectures - Data Structures Using C (YouTube)",
        "DIU Blended Learning Center (BLC) previous question archives"
      ]
    },
    midterm_topics: [
      {
        id: "t-cse221-m1",
        name: "Singly & Doubly Linked List Operations",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 98,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "10 - 15 marks",
        expected_question_types: ["Code Writing", "Dry Run", "Differences"],
        description: "Insertion at beginning/end/given position, deletion of node by value, reversing a linked list, and difference between singly vs doubly vs circular linked lists.",
        status: "pending"
      },
      {
        id: "t-cse221-m2",
        name: "Stack Operations & Infix to Postfix Conversion",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 95,
        repeat_frequency: "Appeared in 7 of last 8 DIU Midterm exams",
        marks_weightage: "8 - 12 marks",
        expected_question_types: ["Dry Run", "Code Writing", "Mathematical"],
        description: "Array and linked list implementation of stack (push, pop, peek), evaluating postfix expressions with trace table, converting infix to postfix using operator stack precedence.",
        status: "pending"
      },
      {
        id: "t-cse221-m3",
        name: "Queue & Circular Queue Implementation",
        exam_term: "midterm",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 85,
        repeat_frequency: "Appeared in 6 of last 8 DIU Midterm exams",
        marks_weightage: "6 - 10 marks",
        expected_question_types: ["Code Writing", "Dry Run", "Differences"],
        description: "Linear queue drawback (false overflow), Circular Queue modulo arithmetic (rear = (rear + 1) % size), enqueue and dequeue operations, and Priority Queue basics.",
        status: "pending"
      },
      {
        id: "t-cse221-m4",
        name: "Time & Space Complexity Analysis of Arrays & Lists",
        exam_term: "midterm",
        priority_stars: 3,
        priority_label: "Medium Priority",
        importance_score: 75,
        repeat_frequency: "Appeared in 5 of last 8 DIU Midterm exams",
        marks_weightage: "4 - 6 marks",
        expected_question_types: ["Theory", "Differences", "Mathematical"],
        description: "Comparative analysis: Array vs Linked list access time, insertion time, memory overhead, and Big-O notation proofs.",
        status: "pending"
      }
    ],
    final_topics: [
      {
        id: "t-cse221-f1",
        name: "Binary Search Tree (BST) & AVL Tree Rotations",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 99,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "12 - 16 marks",
        expected_question_types: ["Diagram", "Dry Run", "Code Writing"],
        description: "BST insertion, deletion (3 cases: leaf, 1 child, 2 children using inorder predecessor/successor), AVL tree balance factors, LL, RR, LR, RL rotation step-by-step diagrams.",
        status: "pending"
      },
      {
        id: "t-cse221-f2",
        name: "Binary Tree Traversals (Inorder, Preorder, Postorder)",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 94,
        repeat_frequency: "Appeared in 7 of last 8 DIU Final exams",
        marks_weightage: "8 - 12 marks",
        expected_question_types: ["Dry Run", "Code Writing", "Diagram"],
        description: "Recursive C code for inorder, preorder, postorder traversals, reconstructing a unique binary tree from Inorder + Preorder sequences.",
        status: "pending"
      },
      {
        id: "t-cse221-f3",
        name: "Graph Representation & Traversals (BFS & DFS)",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 92,
        repeat_frequency: "Appeared in 7 of last 8 DIU Final exams",
        marks_weightage: "10 - 14 marks",
        expected_question_types: ["Dry Run", "Diagram", "Code Writing"],
        description: "Adjacency matrix vs Adjacency list representation, step-by-step BFS traversal using Queue, DFS traversal using Stack/recursion, discovery and finish times.",
        status: "pending"
      },
      {
        id: "t-cse221-f4",
        name: "Heap Data Structure & HeapSort",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 86,
        repeat_frequency: "Appeared in 6 of last 8 DIU Final exams",
        marks_weightage: "6 - 10 marks",
        expected_question_types: ["Diagram", "Dry Run", "Mathematical"],
        description: "Max-Heap and Min-Heap properties, array representation of heap (parent: i/2, left: 2i, right: 2i+1), Heapify algorithm, inserting and extracting max, HeapSort steps.",
        status: "pending"
      },
      {
        id: "t-cse221-f5",
        name: "Hashing & Collision Resolution Techniques",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 80,
        repeat_frequency: "Appeared in 5 of last 8 DIU Final exams",
        marks_weightage: "5 - 8 marks",
        expected_question_types: ["Mathematical", "Differences", "Theory"],
        description: "Hash functions (modulo division, mid-square), collision handling: Open Hashing (Chaining) vs Closed Hashing (Linear Probing, Quadratic Probing, Double Hashing).",
        status: "pending"
      }
    ],
    past_questions: [
      {
        id: "q-cse221-1",
        course_code: "CSE221",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "code",
        marks: 10,
        topic_name: "Singly & Doubly Linked List Operations",
        question_text: "Write a complete C function `void insertAtPosition(struct Node** head, int data, int pos)` to insert a new node at a given position in a Singly Linked List. Handle all boundary conditions including inserting at position 1 and invalid positions.",
        solution_hints: "1. Allocate new node with malloc.\n2. If pos == 1: new_node->next = *head; *head = new_node; return;\n3. Traverse pos-1 steps with temp pointer, checking temp != NULL.\n4. Link new_node->next = temp->next; temp->next = new_node."
      },
      {
        id: "q-cse221-2",
        course_code: "CSE221",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "dry_run",
        marks: 8,
        topic_name: "Stack Operations & Infix to Postfix Conversion",
        question_text: "Convert the following Infix expression to Postfix using the Stack operator precedence algorithm. Show the step-by-step state of the Stack and Postfix expression in tabular format:\nExpression: (A + B * C) / (D - E ^ F * G)",
        solution_hints: "Precedence order: () > ^ (right-to-left) > *, / (left-to-right) > +, - (left-to-right).\nTabular columns required: Symbol Read | Stack Contents | Output Postfix String."
      },
      {
        id: "q-cse221-3",
        course_code: "CSE221",
        exam_term: "midterm",
        exam_session: "Spring 2024",
        question_type: "code",
        marks: 8,
        topic_name: "Singly & Doubly Linked List Operations",
        question_text: "Write a C function `struct Node* reverseList(struct Node* head)` that iteratively reverses a Singly Linked List in O(n) time and O(1) auxiliary space.",
        solution_hints: "Use three pointers: prev = NULL, current = head, next = NULL. In while loop: next = current->next; current->next = prev; prev = current; current = next; return prev."
      },
      {
        id: "q-cse221-4",
        course_code: "CSE221",
        exam_term: "midterm",
        exam_session: "Fall 2023",
        question_type: "difference",
        marks: 5,
        topic_name: "Queue & Circular Queue Implementation",
        question_text: "Differentiate between a Linear Queue and a Circular Queue. Why does a Linear Queue suffer from 'false overflow', and how does a Circular Queue resolve this issue? Give formula for full and empty conditions.",
        solution_hints: "Linear queue: front and rear only move forward, leaving vacated slots unusable. Circular queue wraps rear and front using modulo arithmetic: (rear + 1) % MAX == front means full."
      },
      {
        id: "q-cse221-5",
        course_code: "CSE221",
        exam_term: "final",
        exam_session: "Fall 2024",
        question_type: "diagram",
        marks: 10,
        topic_name: "Binary Search Tree (BST) & AVL Tree Rotations",
        question_text: "Construct an AVL Tree by inserting the following sequence of keys one by one: 50, 25, 10, 5, 20, 70, 80, 75. Show the tree after each insertion, calculate balance factor (BF) for each node, and clearly mention rotation names (LL, RR, LR, RL) applied.",
        solution_hints: "1. 50 (BF: 0)\n2. 25 inserted left.\n3. 10 inserted left -> Node 50 becomes BF +2, Node 25 is +1 -> LL rotation at 50, new root 25.\n4. Continue with subsequent insertions, showing balance factors after every insert."
      },
      {
        id: "q-cse221-6",
        course_code: "CSE221",
        exam_term: "final",
        exam_session: "Fall 2024",
        question_type: "dry_run",
        marks: 8,
        topic_name: "Graph Representation & Traversals (BFS & DFS)",
        question_text: "For the given directed graph with 6 vertices {A, B, C, D, E, F}, perform Breadth First Search (BFS) and Depth First Search (DFS) starting from vertex A. Show the queue/stack contents at every step and write the final traversal sequences.",
        solution_hints: "BFS uses FIFO Queue. Mark visited nodes. DFS uses LIFO Stack or recursion. Write alphabetical tie-breaking rule if specified."
      },
      {
        id: "q-cse221-7",
        course_code: "CSE221",
        exam_term: "final",
        exam_session: "Spring 2024",
        question_type: "math",
        marks: 8,
        topic_name: "Binary Tree Traversals (Inorder, Preorder, Postorder)",
        question_text: "A binary tree has the following traversals:\nInorder: D B E A F C G\nPreorder: A B D E C F G\nReconstruct the original Binary Tree step-by-step and write its Postorder traversal.",
        solution_hints: "Preorder first element 'A' is root. In Inorder, {D, B, E} is left subtree and {F, C, G} is right subtree. Recurse for both sides. Postorder: D E B F G C A."
      },
      {
        id: "q-cse221-8",
        course_code: "CSE221",
        exam_term: "final",
        exam_session: "Fall 2023",
        question_type: "diagram",
        marks: 8,
        topic_name: "Heap Data Structure & HeapSort",
        question_text: "Given the array [12, 11, 13, 5, 6, 7], illustrate the step-by-step process of converting it into a Max-Heap using Heapify algorithm. Then show the first 2 extractions in HeapSort.",
        solution_hints: "Start heapifying from last non-leaf node index (n/2 - 1). Swap parent with largest child if parent < child, and recurse down."
      }
    ]
  },
  CSE222: {
    id: "catalog-cse222",
    code: "CSE222",
    name: "Algorithms",
    credits: "3.0",
    department: "CSE",
    description: "Design and analysis of efficient algorithms: asymptotic analysis, divide and conquer, greedy methods, dynamic programming, graph algorithms (shortest path, MST), NP-completeness.",
    prerequisites_guide: {
      title: "Algorithms - Survival & A+ Blueprint",
      foundational_concepts: [
        {
          concept: "Data Structures Mastery (CSE221)",
          importance: "Critical",
          summary: "Must be confident with Trees, Priority Queues / Heaps, and Graph adjacency lists, as algorithms heavily rely on them."
        },
        {
          concept: "Master Theorem & Recurrence Relations",
          importance: "Critical for Midterm",
          summary: "T(n) = aT(n/b) + f(n). Know cases 1, 2, 3 and substitution method for non-standard recurrences."
        },
        {
          concept: "Greedy vs Dynamic Programming Mindset",
          importance: "High",
          summary: "Greedy chooses local optimum (needs optimal substructure + greedy choice property); DP solves overlapping subproblems (needs memoization / tabulation table)."
        }
      ],
      diu_a_plus_strategy: [
        "In Dynamic Programming questions (0/1 Knapsack, LCS), always draw the 2D DP table with row and column headers, and state the base cases before filling values.",
        "For Dijkstra and Prim's algorithms, always maintain a vertex distance/key table and show status after every relaxation step.",
        "In Divide and Conquer (MergeSort, QuickSort), write the exact recurrence relation and derive its complexity using Master Theorem to earn full marks."
      ],
      common_pitfalls: [
        "Confusing Fractional Knapsack (Greedy, sort by value/weight) with 0/1 Knapsack (Dynamic Programming).",
        "Applying Dijkstra's algorithm to graphs with negative edge weights (Dijkstra fails with negative edges, Bellman-Ford must be used).",
        "Forgetting the back-tracking / trace-back step in LCS (Longest Common Subsequence) to output the actual string sequence."
      ],
      recommended_resources: [
        "Abdul Bari - Algorithms (YouTube)",
        "Introduction to Algorithms (CLRS Textbook)",
        "NeetCode / GeeksforGeeks Algorithms Visualizations"
      ]
    },
    midterm_topics: [
      {
        id: "t-cse222-m1",
        name: "Recurrence Relations & Master Theorem",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 98,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Mathematical", "Theory"],
        description: "Solving recurrences using Master Theorem (3 cases), Recursion Tree method, and Substitution method for Divide & Conquer algorithms.",
        status: "pending"
      },
      {
        id: "t-cse222-m2",
        name: "Divide and Conquer (MergeSort & QuickSort)",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 95,
        repeat_frequency: "Appeared in 7 of last 8 DIU Midterm exams",
        marks_weightage: "10 - 12 marks",
        expected_question_types: ["Code Writing", "Dry Run", "Mathematical"],
        description: "MergeSort divide-combine logic and stability, QuickSort Lomuto/Hoare partition algorithm, best/average O(n log n) and worst-case O(n^2) analysis, randomized pivot selection.",
        status: "pending"
      },
      {
        id: "t-cse222-m3",
        name: "Greedy Method: Fractional Knapsack & Activity Selection",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 92,
        repeat_frequency: "Appeared in 7 of last 8 DIU Midterm exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Dry Run", "Code Writing", "Differences"],
        description: "Greedy choice property, Activity Selection problem sorted by finish time, Fractional Knapsack using value/weight density, Huffman Coding tree construction.",
        status: "pending"
      }
    ],
    final_topics: [
      {
        id: "t-cse222-f1",
        name: "Dynamic Programming: 0/1 Knapsack & LCS",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 99,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "12 - 16 marks",
        expected_question_types: ["Dry Run", "Mathematical", "Code Writing"],
        description: "0/1 Knapsack tabular DP formulation, Longest Common Subsequence (LCS) 2D table and string reconstruction, Matrix Chain Multiplication (MCM) parenthesis placement.",
        status: "pending"
      },
      {
        id: "t-cse222-f2",
        name: "Single Source Shortest Path: Dijkstra & Bellman-Ford",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 96,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "10 - 14 marks",
        expected_question_types: ["Dry Run", "Differences", "Diagram"],
        description: "Dijkstra relaxation using Min-Heap / distance table, Bellman-Ford edge relaxation for |V|-1 iterations, detecting negative weight cycles.",
        status: "pending"
      },
      {
        id: "t-cse222-f3",
        name: "Minimum Spanning Tree (MST): Kruskal & Prim",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 88,
        repeat_frequency: "Appeared in 7 of last 8 DIU Final exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Dry Run", "Differences", "Diagram"],
        description: "Prim's growing tree algorithm, Kruskal's edge-sorting algorithm with Disjoint Set Union (DSU / Find-Union by rank with path compression), cycle detection.",
        status: "pending"
      },
      {
        id: "t-cse222-f4",
        name: "NP-Completeness & Complexity Classes",
        exam_term: "final",
        priority_stars: 3,
        priority_label: "Medium Priority",
        importance_score: 70,
        repeat_frequency: "Appeared in 5 of last 8 DIU Final exams",
        marks_weightage: "5 - 8 marks",
        expected_question_types: ["Theory", "Differences"],
        description: "Definitions of P, NP, NP-Complete, NP-Hard, polynomial-time reduction, Circuit-SAT, 3-CNF SAT, Traveling Salesperson Problem (TSP).",
        status: "pending"
      }
    ],
    past_questions: [
      {
        id: "q-cse222-1",
        course_code: "CSE222",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "math",
        marks: 8,
        topic_name: "Recurrence Relations & Master Theorem",
        question_text: "Determine the asymptotic time complexity for each of the following recurrences using Master Theorem. State clearly which case applies:\n(i) T(n) = 4T(n/2) + n^2\n(ii) T(n) = 8T(n/2) + n^3\n(iii) T(n) = 2T(n/4) + sqrt(n)",
        solution_hints: "Compare f(n) with n^(log_b a).\n(i) a=4, b=2 -> n^(log_2 4) = n^2. f(n) = n^2 -> Case 2: Theta(n^2 log n).\n(ii) a=8, b=2 -> n^(log_2 8) = n^3. f(n) = n^3 -> Case 2: Theta(n^3 log n).\n(iii) a=2, b=4 -> n^(log_4 2) = n^0.5. f(n) = n^0.5 -> Case 2: Theta(sqrt(n) log n)."
      },
      {
        id: "q-cse222-2",
        course_code: "CSE222",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "dry_run",
        marks: 10,
        topic_name: "Greedy Method: Fractional Knapsack & Activity Selection",
        question_text: "A thief has a knapsack with maximum capacity W = 50 kg. The following 5 items are available with values (v_i) and weights (w_i):\nItem 1: v=60, w=10 | Item 2: v=100, w=20 | Item 3: v=120, w=30 | Item 4: v=90, w=15 | Item 5: v=40, w=5\nCompute the maximum total profit using Fractional Knapsack algorithm. Show value-per-weight sorting and selected item fractions.",
        solution_hints: "1. Compute density v/w:\nItem 5: 40/5 = 8\nItem 4: 90/15 = 6\nItem 1: 60/10 = 6\nItem 2: 100/20 = 5\nItem 3: 120/30 = 4\n2. Fill knapsack: Item 5 (w=5, val=40), Item 4 (w=15, val=90), Item 1 (w=10, val=60), Item 2 (w=20, val=100). Total weight = 50kg, total profit = 290."
      },
      {
        id: "q-cse222-3",
        course_code: "CSE222",
        exam_term: "final",
        exam_session: "Fall 2024",
        question_type: "dry_run",
        marks: 12,
        topic_name: "Dynamic Programming: 0/1 Knapsack & LCS",
        question_text: "Given two sequences:\nX = [B, A, B, C, D]\nY = [A, B, C, B, D]\nConstruct the complete 2D dynamic programming table for finding the Longest Common Subsequence (LCS). Draw direction arrows in the table and trace back all optimal LCS sequences.",
        solution_hints: "1. Table of size 6x6 with first row and col initialized to 0.\n2. If X[i] == Y[j]: c[i,j] = c[i-1,j-1] + 1 (diagonal arrow).\n3. Else c[i,j] = max(c[i-1,j], c[i,j-1]) (up or left arrow).\n4. Traceback yields 'B C D' or 'A B D' of length 3."
      }
    ]
  },
  CSE213: {
    id: "catalog-cse213",
    code: "CSE213",
    name: "Object Oriented Programming (Java)",
    credits: "3.0",
    department: "CSE",
    description: "Object-oriented software development principles: encapsulation, inheritance, polymorphism, abstraction, interfaces, exception handling, multithreading, and GUI basics in Java.",
    prerequisites_guide: {
      title: "OOP (Java) - Survival & A+ Blueprint",
      foundational_concepts: [
        {
          concept: "Procedural Programming in C (CSE122)",
          importance: "High",
          summary: "Must be comfortable with loops, functions, variables, arrays, and control structures."
        },
        {
          concept: "Class vs Object Concept & Memory (Stack vs Heap)",
          importance: "Critical",
          summary: "Understanding that primitive types live on stack, while objects and arrays live on heap and are accessed via references."
        },
        {
          concept: "Access Modifiers (private, default, protected, public)",
          importance: "Critical",
          summary: "Encapsulation boundaries, getter/setter patterns, and package visibility."
        }
      ],
      diu_a_plus_strategy: [
        "DIU OOP Midterm exam is heavily code-writing and dry-run oriented: you must be able to trace constructor chaining (super() calls) and method overriding vs overloading.",
        "In Exception Handling questions, always explain the execution order of try-catch-finally blocks.",
        "Write syntactically correct Java: class declarations, public static void main(String[] args), and proper constructor syntax."
      ],
      common_pitfalls: [
        "Forgetting that static variables/methods belong to the class, not object instances.",
        "Attempting to instantiate an abstract class or interface.",
        "Calling super() somewhere other than the FIRST statement in a child class constructor."
      ],
      recommended_resources: [
        "Telusko Java Series (YouTube)",
        "Java Programming - Tim Buchalka (Udemy / YouTube)",
        "Oracle Java Documentation"
      ]
    },
    midterm_topics: [
      {
        id: "t-cse213-m1",
        name: "Classes, Constructors & Constructor Chaining",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 96,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Code Writing", "Dry Run"],
        description: "Default, parameterized, and copy constructors, 'this' keyword, 'this()' and 'super()' constructor chaining order in inheritance hierarchies.",
        status: "pending"
      },
      {
        id: "t-cse213-m2",
        name: "Inheritance, Method Overriding vs Overloading",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 98,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "10 - 12 marks",
        expected_question_types: ["Code Writing", "Differences", "Dry Run"],
        description: "Extends keyword, runtime polymorphism (dynamic method dispatch), @Override annotation, compile-time overloading rules, and output tracing with upcasting.",
        status: "pending"
      },
      {
        id: "t-cse213-m3",
        name: "Encapsulation & Access Modifiers",
        exam_term: "midterm",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 82,
        repeat_frequency: "Appeared in 6 of last 8 DIU Midterm exams",
        marks_weightage: "5 - 8 marks",
        expected_question_types: ["Theory", "Differences", "Code Writing"],
        description: "Public, private, protected, and default (package-private) visibility matrix, getter/setter patterns, immutability.",
        status: "pending"
      }
    ],
    final_topics: [
      {
        id: "t-cse213-f1",
        name: "Abstract Classes vs Interfaces & Multiple Inheritance",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 97,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "10 - 12 marks",
        expected_question_types: ["Differences", "Code Writing", "Theory"],
        description: "Abstract methods, interface implementation with 'implements', Java 8 default and static methods in interface, achieving multiple inheritance in Java.",
        status: "pending"
      },
      {
        id: "t-cse213-f2",
        name: "Exception Handling (try-catch-finally, throw, throws)",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 95,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Dry Run", "Code Writing", "Differences"],
        description: "Checked vs Unchecked exceptions, try-catch-finally execution flow, creating custom user-defined exceptions by extending Exception class.",
        status: "pending"
      },
      {
        id: "t-cse213-f3",
        name: "Multithreading & Synchronization in Java",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 85,
        repeat_frequency: "Appeared in 7 of last 8 DIU Final exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Code Writing", "Differences", "Theory"],
        description: "Thread creation: extending Thread class vs implementing Runnable interface, thread lifecycle, synchronized methods/blocks, inter-thread communication (wait, notify).",
        status: "pending"
      }
    ],
    past_questions: [
      {
        id: "q-cse213-1",
        course_code: "CSE213",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "code",
        marks: 10,
        topic_name: "Inheritance, Method Overriding vs Overloading",
        question_text: "Design a Java class hierarchy: Create an abstract class `Employee` with attributes `id`, `name`, `baseSalary` and abstract method `calculateSalary()`. Then create subclasses `FullTimeEmployee` (bonus = 20% of baseSalary) and `PartTimeEmployee` (paid based on hourlyRate * hoursWorked). Write complete Java code with constructors and demonstrate dynamic method dispatch in main().",
        solution_hints: "1. abstract class Employee { ... abstract double calculateSalary(); }\n2. class FullTimeEmployee extends Employee { ... }\n3. class PartTimeEmployee extends Employee { ... }\n4. In main: Employee e1 = new FullTimeEmployee(...); e1.calculateSalary(); demonstrates polymorphism."
      },
      {
        id: "q-cse213-2",
        course_code: "CSE213",
        exam_term: "final",
        exam_session: "Fall 2024",
        question_type: "code",
        marks: 8,
        topic_name: "Exception Handling (try-catch-finally, throw, throws)",
        question_text: "Create a custom checked exception `InvalidAgeException` in Java. Write a class `VoterRegistration` with a method `registerVoter(int age)` that throws `InvalidAgeException` if age < 18. Handle the exception in main using try-catch.",
        solution_hints: "1. class InvalidAgeException extends Exception { public InvalidAgeException(String msg) { super(msg); } }\n2. void registerVoter(int age) throws InvalidAgeException { if (age < 18) throw new InvalidAgeException(\"Age must be >= 18\"); }\n3. In main, wrap in try-catch block."
      }
    ]
  },
  CSE311: {
    id: "catalog-cse311",
    code: "CSE311",
    name: "Database Management Systems (DBMS)",
    credits: "3.0",
    department: "CSE",
    description: "Database system architectures, Relational Data Model, ER Modeling, Relational Algebra, SQL (DDL, DML, subqueries, joins), Normalization (1NF through BCNF), and Transaction Processing (ACID).",
    prerequisites_guide: {
      title: "DBMS - Survival & A+ Blueprint",
      foundational_concepts: [
        {
          concept: "Basic Set Theory & Cartesian Products",
          importance: "High",
          summary: "Relations are sets of tuples. Relational operations (Union, Intersection, Cartesian Product) form the theoretical base of SQL Joins."
        },
        {
          concept: "Entity & Attribute Understanding",
          importance: "Critical for Midterm ERD",
          summary: "Entities, composite attributes, multivalued attributes, derived attributes, primary key vs foreign key."
        }
      ],
      diu_a_plus_strategy: [
        "ER Diagram is a guaranteed 10-12 marks in Midterm: Use standard Chen or Crow's Foot notation, mark primary keys (underlined), and label cardinality (1:1, 1:N, M:N) clearly.",
        "In SQL questions, practice complex subqueries, GROUP BY with HAVING, and LEFT/RIGHT JOINs — DIU tests edge cases with NULL handling.",
        "For Normalization (1NF, 2NF, 3NF, BCNF) in the Final exam, always list Candidate Keys first by computing attribute closures (F+)."
      ],
      common_pitfalls: [
        "Forgetting to underline primary keys and using incorrect arrow shapes in ER diagrams.",
        "Using WHERE instead of HAVING for aggregate function filtering in SQL (e.g. HAVING COUNT(*) > 2).",
        "Lossy decompositions in Normalization: not preserving functional dependencies or candidate keys."
      ],
      recommended_resources: [
        "Gate Smashers - DBMS Playlist (YouTube)",
        "Database System Concepts (Silberschatz, Korth, Sudarshan)",
        "SQLZoo / LeetCode SQL Practice"
      ]
    },
    midterm_topics: [
      {
        id: "t-cse311-m1",
        name: "Entity-Relationship (ER) Modeling & Schema Conversion",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 98,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "10 - 15 marks",
        expected_question_types: ["Diagram", "Theory"],
        description: "Draw ER diagrams for university/hospital/banking scenarios, handle weak entities, multivalued attributes, ternary relationships, and convert ER diagram into Relational Tables.",
        status: "pending"
      },
      {
        id: "t-cse311-m2",
        name: "Relational Algebra (Selection, Projection, Joins)",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 92,
        repeat_frequency: "Appeared in 7 of last 8 DIU Midterm exams",
        marks_weightage: "8 - 10 marks",
        expected_question_types: ["Mathematical", "Theory"],
        description: "Relational algebra queries using sigma (selection), pi (projection), rho (rename), cross product, natural join, theta join, and division operator.",
        status: "pending"
      },
      {
        id: "t-cse311-m3",
        name: "Core SQL Queries (DDL, DML, Joins, Aggregations)",
        exam_term: "midterm",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 95,
        repeat_frequency: "Appeared in 8 of last 8 DIU Midterm exams",
        marks_weightage: "10 - 12 marks",
        expected_question_types: ["Code Writing", "Dry Run"],
        description: "CREATE TABLE with constraints (PK, FK, UNIQUE, NOT NULL, CHECK), nested subqueries, GROUP BY and HAVING clauses, INNER and OUTER JOINs.",
        status: "pending"
      }
    ],
    final_topics: [
      {
        id: "t-cse311-f1",
        name: "Functional Dependencies & Normalization (1NF, 2NF, 3NF, BCNF)",
        exam_term: "final",
        priority_stars: 5,
        priority_label: "Critical (Guaranteed)",
        importance_score: 99,
        repeat_frequency: "Appeared in 8 of last 8 DIU Final exams",
        marks_weightage: "14 - 18 marks",
        expected_question_types: ["Mathematical", "Differences", "Theory"],
        description: "Finding Candidate Keys using attribute closure (X+), finding Minimal Cover, testing for 1NF, 2NF (partial dependency), 3NF (transitive dependency), and BCNF, lossless join decomposition.",
        status: "pending"
      },
      {
        id: "t-cse311-f2",
        name: "Transactions & ACID Properties",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 86,
        repeat_frequency: "Appeared in 7 of last 8 DIU Final exams",
        marks_weightage: "6 - 10 marks",
        expected_question_types: ["Theory", "Differences"],
        description: "Atomicity, Consistency, Isolation, Durability, Transaction states (Active, Partially Committed, Committed, Failed, Aborted), Dirty Read, Lost Update, Unrepeatable Read anomalies.",
        status: "pending"
      },
      {
        id: "t-cse311-f3",
        name: "Concurrency Control & Serializability",
        exam_term: "final",
        priority_stars: 4,
        priority_label: "High Priority",
        importance_score: 84,
        repeat_frequency: "Appeared in 6 of last 8 DIU Final exams",
        marks_weightage: "8 - 12 marks",
        expected_question_types: ["Dry Run", "Mathematical", "Diagram"],
        description: "Conflict Serializability, testing conflict serializability using Precedence Graph (cycle detection), Two-Phase Locking (2PL) protocol, Strict 2PL, Deadlock handling.",
        status: "pending"
      }
    ],
    past_questions: [
      {
        id: "q-cse311-1",
        course_code: "CSE311",
        exam_term: "midterm",
        exam_session: "Fall 2024",
        question_type: "diagram",
        marks: 12,
        topic_name: "Entity-Relationship (ER) Modeling & Schema Conversion",
        question_text: "Design a complete ER Diagram for Daffodil International University (DIU) Course Registration System: A Student has student_id, name, email. A Department has dept_id, name. A Teacher has teacher_id, designation, salary. A Course has course_code, title, credits. A Student enrolls in multiple Courses, each Course is taught by one Teacher. Show keys, cardinality ratios, and weak entity sets.",
        solution_hints: "Identify entities: Student, Department, Teacher, Course. Relationships: Belongs_To (Student to Dept), Teaches (Teacher to Course), Enrolls (Student to Course M:N with grade/semester as attribute)."
      },
      {
        id: "q-cse311-2",
        course_code: "CSE311",
        exam_term: "final",
        exam_session: "Fall 2024",
        question_type: "math",
        marks: 14,
        topic_name: "Functional Dependencies & Normalization (1NF, 2NF, 3NF, BCNF)",
        question_text: "Consider relation R(A, B, C, D, E) with Functional Dependencies F = { A -> BC, CD -> E, B -> D, E -> A }.\n(a) Find all Candidate Keys of relation R.\n(b) Determine the highest normal form (1NF, 2NF, 3NF, or BCNF) of relation R, justifying your answer with definitions.\n(c) Decompose into BCNF if not already in BCNF.",
        solution_hints: "1. Compute closures: A+ = {A,B,C,D,E} -> A is a candidate key. E+ = {E,A,B,C,D} -> E is also a candidate key. Check CD+ = {C,D,E,A,B} and BC+ = {B,C,D,E,A} -> BC is a candidate key.\n2. In B -> D, B is not a superkey and D is not prime -> violates 2NF or 3NF."
      }
    ]
  }
};

// Local storage management helpers
const LOCAL_SEMESTERS_KEY = "diu_user_semesters_v1";
const LOCAL_CUSTOM_QUESTIONS_KEY = "diu_custom_questions_v1";

export interface UserSemesterRecord {
  id: string;
  user_id: string;
  title: string;
  term: string;
  department: string;
  is_active: number;
  created_at: string;
  courses: DIUCourseItem[];
}

export function getLocalSemesters(): UserSemesterRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SEMESTERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  // Initialize default starter semester for DIU student: Semester 3
  const starterCourseCodes = ["CSE221", "CSE213"];
  const starterCourses = starterCourseCodes.map(code => DIU_COURSE_CATALOG[code] || {
    id: `course-${code}`,
    code,
    name: `Course ${code}`,
    credits: "3.0",
    department: "CSE",
    description: "",
    prerequisites_guide: { title: "", foundational_concepts: [], diu_a_plus_strategy: [], common_pitfalls: [], recommended_resources: [] },
    midterm_topics: [],
    final_topics: [],
    past_questions: []
  });

  const defaultSem: UserSemesterRecord = {
    id: "sem-default-1",
    user_id: "demo-user",
    title: "Semester 3 (Level 2 Term 1)",
    term: "Spring 2025",
    department: "CSE",
    is_active: 1,
    created_at: new Date().toISOString(),
    courses: starterCourses
  };

  saveLocalSemesters([defaultSem]);
  return [defaultSem];
}

export function saveLocalSemesters(semesters: UserSemesterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_SEMESTERS_KEY, JSON.stringify(semesters));
    window.dispatchEvent(new Event("diu_semesters_updated"));
  } catch (e) {}
}

export function getLocalAllPastQuestions(): DIUPastQuestionItem[] {
  const catalogQuestions: DIUPastQuestionItem[] = [];
  Object.values(DIU_COURSE_CATALOG).forEach(c => {
    if (c.past_questions) {
      catalogQuestions.push(...c.past_questions);
    }
  });

  if (typeof window === "undefined") return catalogQuestions;
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_QUESTIONS_KEY);
    if (raw) {
      const custom: DIUPastQuestionItem[] = JSON.parse(raw);
      return [...custom, ...catalogQuestions];
    }
  } catch (e) {}

  return catalogQuestions;
}

export function saveLocalCustomQuestion(question: DIUPastQuestionItem) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_QUESTIONS_KEY);
    const existing: DIUPastQuestionItem[] = raw ? JSON.parse(raw) : [];
    existing.unshift(question);
    localStorage.setItem(LOCAL_CUSTOM_QUESTIONS_KEY, JSON.stringify(existing));
    window.dispatchEvent(new Event("diu_questions_updated"));
  } catch (e) {}
}
