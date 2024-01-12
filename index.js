const inquirer = require("inquirer");
const mysql = require("mysql2");

// create a connection to mysql with mysql2
const db = mysql.createConnection({
  // choose localhost, the root user, password and the database, that needs to be queried
  host: "LocalHost",
  user: "root",
  password: "Toronto19$",
  database: "company_db",
});

// the question to start the application, with all the features as actions in the application
const question = {
  type: "list",
  message: "What would you like to do?",
  name: "action",
  choices: [
    "View all Employees",
    "Add Employee",
    "Update Employee Role",
    "View all Roles",
    "Add Role",
    "View all Departments",
    "Add Department",
    "Update Manager of Employee",
    "View Employees by Manager",
    "View Employees by Department",
    "Delete Department",
    "Delete Role",
    "Delete Employee",
    "View total budget of department",
    "Quit",
  ],
};

// view all the employees in the db
function viewAllEmployees() {
  // query to have the tables join so you can see the id, first_name, last_name, the role title, the department name, the salary and the manager of the employees in one table
  db.query(
    "SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ',m.last_name) AS manager FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id LEFT JOIN employee m ON e.manager_id = m.id",
    function (err, results) {
      if (err) {
        console.log(err);
      }
      // console.table displays the results in a table
      console.table(results);
      // call the inquirer function to continue using the app and not restart writing node index.js every time
      employeeManager();
    }
  );
}

// function to add another employee to the db
function addEmployee() {
  // get the role titles
  db.query("SELECT title FROM role", function (err, roleResults) {
    if (err) {
      console.log(err);
      return;
    }

    // storing the results of the role titles in an array
    const roleTitles = roleResults.map((row) => row.title);

    // select the employees to assign them a manager position
    db.query(
      'SELECT CONCAT(first_name, " ", last_name) AS managerName FROM employee',
      function (err, managerResults) {
        if (err) {
          console.log(err);
          return;
        }
        // store the managerNames in an array as well
        const managerNames = managerResults.map((row) => row.managerName);

        // adds option of no manager
        managerNames.unshift("None");
        // let user input first and last name of new employee
        inquirer
          .prompt([
            {
              type: "input",
              message: "What is the employee's first name?",
              name: "fName",
            },
            {
              type: "input",
              message: "What is the employee's last name?",
              name: "lName",
            },
            {
              // let user choose the role, which was stored as a choice in an array
              type: "list",
              message: "What is the employee's role?",
              name: "employeeRole",
              choices: roleTitles,
            },
            {
              // let user choose the manager as well, which is selected from the array of current employees
              type: "list",
              message: "Who is the employee's manager?",
              name: "employeeManager",
              choices: managerNames,
            },
          ])
          // the answers will be stored in constants
          .then((answers) => {
            const firstName = answers.fName;
            const lastName = answers.lName;
            const roleTitle = answers.employeeRole;
            const managerName = answers.employeeManager;

            // from the chosen role, take the role id to store it in the db
            db.query(
              `SELECT id FROM role WHERE title = '${roleTitle}'`,
              function (err, roleResult) {
                if (err) {
                  console.log(err);
                  return;
                }

                // store the id of the result in a constant
                const roleId = roleResult[0].id;
                // default for managerId is null
                let managerId = null;

                // the same process for the employee, which will be stored as a manager in an id, the manager will be not null, if managerName is chosen
                if (managerName !== "None") {
                  db.query(
                    `SELECT id FROM employee WHERE CONCAT(first_name, ' ', last_name) = '${managerName}'`,
                    function (err, managerResult) {
                      if (err) {
                        console.log(err);
                        return;
                      }

                      // this will store the managerId
                      const managerId = managerResult[0].id;

                      // store all these values in the employee table
                      db.query(
                        `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ('${firstName}', '${lastName}', ${roleId}, ${managerId})`,
                        function (err, results) {
                          if (err) {
                            console.log(err);
                          } else {
                            // logs the new employee in the database
                            console.log(
                              `Added ${firstName} ${lastName} to the database`
                            );
                          }
                          employeeManager();
                        }
                      );
                    }
                  );
                }
              }
            );
          });
      }
    );
  });
}

// updates the role of an employee
function updateEmployeeRole() {
  // selects employees to store them in am array
  db.query(
    'SELECT id, CONCAT(first_name, " ", last_name) AS employeeName FROM employee',
    function (err, employeeResults) {
      if (err) {
        console.log(err);
        return;
      }

      // store employeeresults in an array as an object with name and id
      const employeeChoices = employeeResults.map((row) => {
        return {
          name: row.employeeName,
          value: row.id,
        };
      });

      // get id from the role
      db.query("SELECT id, title FROM role", function (err, roleResults) {
        if (err) {
          console.log(err);
          return;
        }

        // store roles also in an array with title and id
        const roleChoices = roleResults.map((row) => {
          return {
            name: row.title,
            value: row.id,
          };
        });

        // let user choose between which employee they want to updated, and then the role they want to assign to the employee
        inquirer
          .prompt([
            {
              type: "list",
              message: "Which employee's role do you want to update?",
              name: "selectedEmployee",
              choices: employeeChoices,
            },
            {
              type: "list",
              message:
                "Which role do you want to assign the selected employee?",
              name: "newRoleId",
              choices: roleChoices,
            },
          ])
          // store the answers in constants
          .then((answers) => {
            const selectedEmployeeId = answers.selectedEmployee;
            const newRoleId = answers.newRoleId;

            // use answers to updated the newRole id to the specific employeeid
            db.query(
              `UPDATE employee SET role_id = ${newRoleId} WHERE id = ${selectedEmployeeId}`,
              function (err, updateResult) {
                if (err) {
                  console.log(err);
                } else {
                  // display message that role is updated
                  console.log("Updated employee's role");
                }
                employeeManager();
              }
            );
          });
      });
    }
  );
}

// let's user view all the roles
function viewAllRoles() {
  // role id, role title, department name and salary are shown in a table
  db.query(
    "SELECT r.id, r.title, d.name AS department, r.salary FROM department d JOIN role r ON d.id = r.department_id",
    function (err, results) {
      if (err) {
        console.log(err);
      }
      console.table(results);
      employeeManager();
    }
  );
}

// add new Role
function addRole() {
  // query db to get department name
  db.query("SELECT name FROM department", function (err, results) {
    if (err) {
      console.log(err);
      return;
    }

    // store them as departmentChoices in an array
    const departmentChoices = results.map((row) => row.name);

    // user chooses name of new role, the salary, and can choose from the current departmentchoices
    inquirer
      .prompt([
        {
          type: "input",
          message: "What is the name of the role?",
          name: "roleName",
        },
        {
          type: "input",
          message: "What is the salary of the role?",
          name: "salary",
        },
        {
          type: "list",
          message: "Which department does the role belong to?",
          name: "departmentChoice",
          choices: departmentChoices,
        },
      ])
      // those answers are stored in constants
      .then((answers) => {
        const roleName = answers.roleName;
        const salary = answers.salary;
        const department = answers.departmentChoice;

        // insert the new role into the role table with the given answers
        db.query(
          `INSERT INTO role (title, salary, department_id) VALUES ('${roleName}', '${salary}',(SELECT id FROM department WHERE name = '${department}'))`,
          function (err, results) {
            if (err) {
              console.log(err);
            } else {
              console.log(`Added ${roleName} to the database`);
            }
            employeeManager();
          }
        );
      });
  });
}

// lets user view the departments
function viewAllDepartments() {
  // query to show the whole department table
  db.query("SELECT * FROM department", function (err, results) {
    if (err) {
      console.log(err);
    }
    console.table(results);
    employeeManager();
  });
}

// add another department
function addDepartment() {
  // let's user enter name of new department
  inquirer
    .prompt({
      type: "input",
      message: "What is the name of the department?",
      name: "departmentName",
    })
    .then((answers) => {
      // store answer in constant
      const newDepartment = answers.departmentName;

      // insert  new department into department table
      db.query(
        `INSERT INTO department (name) VALUES ('${newDepartment}')`,
        function (err, results) {
          if (err) {
            console.log(err);
          } else {
            console.log(`Added ${newDepartment} to the database`);
          }
          employeeManager();
        }
      );
    });
}

// update the manager of an employee
function updateEmployeeManager() {
  // select the employees from the employee table
  db.query(
    'SELECT id, CONCAT(first_name, " ", last_name) AS employeeName FROM employee',
    function (err, employeeResults) {
      if (err) {
        console.log(err);
        return;
      }

      // map the results in an array with name and id
      const employeeChoices = employeeResults.map((row) => {
        return {
          name: row.employeeName,
          value: row.id,
        };
      });

      // the managerchoices spread in an array and with one more choice of No manager with the value null
      const managerChoices = [
        ...employeeChoices,
        { name: "None", value: null },
      ];

      // let user choose employees and the new manager to assign to the employee
      inquirer
        .prompt([
          {
            type: "list",
            message: "Which employee's manager do you want to update?",
            name: "selectedEmployee",
            choices: employeeChoices,
          },
          {
            type: "list",
            message:
              "Which new manager would you like to choose for the employee?",
            name: "newManagerId",
            choices: managerChoices,
          },
        ])
        // store answers in constant
        .then((answers) => {
          const selectedEmployeeId = answers.selectedEmployee;
          const newManagerId = answers.newManagerId;

          // use the answers to update the employees manager
          db.query(
            `UPDATE employee SET manager_id = ${newManagerId} WHERE id = ${selectedEmployeeId}`,
            function (err, updateResult) {
              if (err) {
                console.log(err);
              } else {
                console.log(`Updated employee's manager`);
              }

              employeeManager();
            }
          );
        });
    }
  );
}

// view the employees by their manager
function viewEmployeesByManager() {
  // select the managers that are assigned
  db.query(
    'SELECT DISTINCT m.id, CONCAT(m.first_name, " ", m.last_name) AS managerName FROM employee e JOIN employee m ON e.manager_id = m.id',
    function (err, managerResults) {
      if (err) {
        console.log(err);
        return;
      }

      // store the managers in an array with name and id
      const managerChoices = managerResults.map((row) => {
        return {
          name: row.managerName,
          value: row.id,
        };
      });

      // let user choose the manager, to see the employees assigned to that manager
      inquirer
        .prompt([
          {
            type: "list",
            message: "Which manager would you like to view the employees from?",
            name: "selectedManager",
            choices: managerChoices,
          },
        ])
        .then((answers) => {
          const selectedManagerId = answers.selectedManager;

          // show the employees id, first name, last name, role title, department name and the role salary of the employees
          db.query(
            `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id WHERE e.manager_id = ${selectedManagerId}`,
            function (err, results) {
              if (err) {
                console.log(err);
              }
              console.table(results);
              employeeManager();
            }
          );
        });
    }
  );
}

// view employees by department, same as view employees by manager
function viewEmployeesByDepartment() {
  db.query("SELECT * FROM department", function (err, departmentResults) {
    if (err) {
      console.log(err);
      return;
    }

    const departmentChoices = departmentResults.map((row) => {
      return {
        name: row.name,
        value: row.id,
      };
    });

    inquirer
      .prompt([
        {
          type: "list",
          message: "Which department would you like to see its employees from?",
          name: "selectedDepartment",
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const selectedDepartmentId = answers.selectedDepartment;

        db.query(
          `SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id WHERE d.id = ${selectedDepartmentId}`,
          function (err, results) {
            if (err) {
              console.log(err);
            }
            console.table(results);
            employeeManager();
          }
        );
      });
  });
}

// delete department
function deleteDepartment() {
  // query department table to get department names
  db.query("SELECT * FROM department", function (err, departmentResults) {
    if (err) {
      console.log(err);
      return;
    }

    // store the departments in an array, same as above
    const departmentChoices = departmentResults.map((row) => {
      return {
        name: row.name,
        value: row.id,
      };
    });

    // let user choose the department to delete
    inquirer
      .prompt([
        {
          type: "list",
          message: "Which department would you like to delete?",
          name: "selectedDepartment",
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const selectedDepartmentId = answers.selectedDepartment;

        // perform a delete query to delete department
        db.query(
          `DELETE FROM department WHERE id = ${selectedDepartmentId}`,
          function (err, deleteResult) {
            if (err) {
              console.log(err);
            } else {
              console.log("Department removed from the database");
            }
            employeeManager();
          }
        );
      });
  });
}

// let user delete role, same as delete department
function deleteRole() {
  db.query("SELECT * FROM role", function (err, roleResults) {
    if (err) {
      console.log(err);
      return;
    }

    const roleChoices = roleResults.map((row) => {
      return {
        name: row.title,
        value: row.id,
      };
    });

    inquirer
      .prompt([
        {
          type: "list",
          message: "Which role would you like to delete?",
          name: "selectedRole",
          choices: roleChoices,
        },
      ])
      .then((answers) => {
        const selectedRoleId = answers.selectedRole;

        db.query(
          `DELETE FROM role WHERE id = ${selectedRoleId}`,
          function (err, deleteResult) {
            if (err) {
              console.log(err);
            } else {
              console.log("Role removed from the database");
            }
            employeeManager();
          }
        );
      });
  });
}

// let user delete employee, same as delete department
function deleteEmployee() {
  db.query(
    'SELECT id, CONCAT(first_name, " ", last_name) AS employeeName FROM employee',
    function (err, employeeResults) {
      if (err) {
        console.log(err);
        return;
      }

      const employeeChoices = employeeResults.map((row) => {
        return {
          name: row.employeeName,
          value: row.id,
        };
      });

      inquirer
        .prompt([
          {
            type: "list",
            message: "Which employee would you like to delete?",
            name: "selectedEmployee",
            choices: employeeChoices,
          },
        ])
        .then((answers) => {
          const selectedEmployeeId = answers.selectedEmployee;

          db.query(
            `DELETE FROM employee WHERE id = ${selectedEmployeeId}`,
            function (err, deleteResult) {
              if (err) {
                console.log(err);
              } else {
                console.log("Employee removed from the database");
              }
              employeeManager();
            }
          );
        });
    }
  );
}

// calculate total budget of department
function calculateTotalBudget() {
  // select all departments
  db.query("SELECT * FROM department", function (err, departmentResults) {
    if (err) {
      console.log(err);
      return;
    }

    // store them as above
    const departmentChoices = departmentResults.map((row) => {
      return {
        name: row.name,
        value: row.id,
      };
    });

    // let user choose department
    inquirer
      .prompt([
        {
          type: "list",
          message:
            "Which department would you like to calculate its total budget from?",
          name: "selectedDepartment",
          choices: departmentChoices,
        },
      ])
      .then((answers) => {
        const selectedDepartmentId = answers.selectedDepartment;

        // perform the sum query on the role salary of a specific department, based on department id
        db.query(
          `SELECT SUM(r.salary) AS totalBudget FROM employee e JOIN role r ON e.role_id = r.id JOIN department d ON r.department_id = d.id WHERE d.id = ${selectedDepartmentId}`,
          function (err, results) {
            if (err) {
              console.log(err);
            }
            // display the total budget of the department
            console.log(
              `The total budget of the department: $${results[0].totalBudget}`
            );
            employeeManager();
          }
        );
      });
  });
}

// inquirer function that runs the application, takes the answers as actions and based on the chosen answer it will execute the necessary function
function employeeManager() {
  inquirer.prompt(question).then((answers) => {
    switch (answers.action) {
      // use switch cases to execute function based on chosen action
      case "View all Employees":
        viewAllEmployees();
        break;
      case "Add Employee":
        addEmployee();
        break;
      case "Update Employee Role":
        updateEmployeeRole();
        break;
      case "View all Roles":
        viewAllRoles();
        break;
      case "Add Role":
        addRole();
        break;
      case "View all Departments":
        viewAllDepartments();
        break;
      case "Add Department":
        addDepartment();
        break;
      case "Update Manager of Employee":
        updateEmployeeManager();
        break;
      case "View Employees by Manager":
        viewEmployeesByManager();
        break;
      case "View Employees by Department":
        viewEmployeesByDepartment();
        break;
      case "Delete Department":
        deleteDepartment();
        break;
      case "Delete Role":
        deleteRole();
        break;
      case "Delete Employee":
        deleteEmployee();
        break;
      case "View total budget of department":
        calculateTotalBudget();
        break;
      case "Quit":
        // let's user quit the application and displays exit message
        console.log("Exiting the employee manager...see you next time!");
        process.exit();
        break;
    }
  });
}

// start employeeManager application
employeeManager();
