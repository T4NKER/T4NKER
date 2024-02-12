document.getElementById("login-button").addEventListener("click", () => {
    const username = document.getElementById("username-email").value;
    const password = document.getElementById("login-password").value;
    login(username, password);
});
//logoutbutton ka



let isLoggedin = false;

async function login(username, password) {

    username = username.trim();
    password = password.trim();
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);
    try {
        const response = await fetch("https://01.kood.tech/api/auth/signin", {
            method: "POST",
            headers: {
                Authorization: `Basic ${encodedCredentials}`,
            },
        });
        if (response.ok) {
            const token = await response.json();
            localStorage.setItem('JWTtoken', token);
            isLoggedin = true
            requestGLData();
            document.getElementById('login-container').style.display = 'none';

        } else {
            const errorData = await response.json()
            alert(errorData.error)

        }
    } catch (error) {
        console.log("Error: ", error)
        alert(error)
    }
}

async function requestGLData() {
    const userQuery = `
    query {
        user {
          attrs
          id
          auditRatio
          totalUp
          totalDown
          createdAt
          updatedAt
          githubId
          transactions(order_by: { createdAt: asc }) {
            amount
            type
            path
            createdAt
          }
        }
      }
      
`


    fetch('https://01.kood.tech/api/graphql-engine/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('JWTtoken')}`
        },
        body: JSON.stringify({ query: userQuery }),
    })
        .then(response => response.json())
        .then(userData => {

            document.getElementById("full-container").style.display = "block";

            const { firstName, lastName, personalIdentificationCode, } = userData.data.user[0].attrs
            const auditRatio = userData.data.user[0].auditRatio
            const userID = userData.data.user[0].id
            const userJoined = userData.data.user[0].createdAt
            const totalUp = userData.data.user[0].totalUp
            const totalDown = userData.data.user[0].totalDown
            const userAuditRatio = totalUp / totalDown.toFixed(2)

            const transactions = userData.data.user[0].transactions

            const personalInfo = document.getElementById("personal-info")

            const nameElement = document.createElement("p")
            nameElement.innerHTML = firstName + " " + lastName

            const userIDElement = document.createElement("p");
            userIDElement.innerHTML = "Your userID is " + userID

            const personalIDElement = document.createElement("p");
            personalIDElement.innerHTML = "Your personal identification code is " + personalIdentificationCode

            const joined = document.createElement("p");
            const joinedDate = new Date(userJoined);
            const formattedDate = joinedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' });
            joined.innerHTML = "You joined on " + formattedDate;

            personalInfo.appendChild(nameElement);
            personalInfo.appendChild(userIDElement);
            personalInfo.appendChild(personalIDElement);
            personalInfo.appendChild(joined);


            let sortedArray = [];

            for (let transaction of transactions) {
                if (transaction.path.startsWith('/johvi/div-01/piscine-js') || transaction.path.startsWith('/johvi/piscine-go')) {
                    continue
                } else if (transaction.type === 'xp') {
                    sortedArray.push(transaction)
                }
            }

            let cumulativeXpSum = [];
            let sum = 0;
            let xpVals = [];

            for (let transaction of sortedArray) {
                let xpValue = transaction.amount;
                xpVals.push(xpValue);
            }

            for (let xpValue of xpVals) {
                sum += xpValue;
                cumulativeXpSum.push(sum);
            }

            const dates = sortedArray.map(transaction => {
                const date = new Date(transaction.createdAt);
                return date.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric', year: 'numeric' });
            });
            const xpValues = sortedArray.map(transaction => transaction.value);

            new Chart("xpChart", {
                type: "line",
                data: {
                    labels: dates,
                    datasets: [{
                        label: "Cumulative XP",
                        fill: false,
                        lineTension: 0,
                        backgroundColor: "rgba(0, 0, 0, 1.0)",
                        borderColor: "rgba(255, 255, 255, 1.0)",
                        data: cumulativeXpSum,
                    }]
                },
                options: {
                    scales: {
                        y: {
                            ticks: {
                                color: 'white', // Change the color of the y-axis ticks to black
                                beginAtZero: true,
                            }
                        },
                        x: {
                            ticks: {
                                color: 'white', // Change the color of the x-axis ticks to black
                                beginAtZero: true,
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display:true, 
                            text: "Total XP by time",
                            color: 'white'
                        },
                        legend: {
                            labels: {
                                color: 'white' // Change the font color of the legend labels here
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dateLabel = dates[context.dataIndex];
                                    const xpValue = cumulativeXpSum[context.dataIndex];
                                    const transactionPath = sortedArray[context.dataIndex].path.split('/').pop();

                                    // Customize tooltip content to include date, XP value, and transaction path
                                    return `Date: ${dateLabel}\n Total XP: ${xpValue}\n Project: ${transactionPath}`;
                                }
                            }
                        }
                    }
                }
            })


            const totalUpPercentage = (totalUp / (totalUp + totalDown)) * 100;
            const totalDownPercentage = (totalDown / (totalUp + totalDown)) * 100;

            // Create a data array for the auditChart
            const auditChartData = [totalUpPercentage, totalDownPercentage];

            new Chart("auditChart", {
                type: "doughnut",
                data: {
                    labels: ["Total Up", "Total Down"],
                    datasets: [{
                        data: auditChartData,
                        backgroundColor: ["rgba(255,255,255,1.0)", "rgba(0, 0, 0, 1.0)"], // Green for Audit Ratio, Red for Remaining
                    }]
                },
                options: {
                    plugins: {
                        title: {
                            display:true, 
                            text: "Audit ratio",
                            color: 'white'
                        },
                        legend: {
                            display: true,
                            labels: {
                                color: 'white' // Change the font color of the legend labels here
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const dataIndex = context.dataIndex;
                                    const value = auditChartData[dataIndex];
                                    const label = context.label;

                                    // Customize tooltip content based on the side hovered
                                    if (label === "Total Up") {
                                        const totalUpValue = (totalUp / (totalUp + totalDown)) * 100;
                                        return `Total Up: ${totalUpValue.toFixed(2)}% (${totalUp}) bytes`;
                                    } else if (label === "Total Down") {
                                        const totalDownValue = (totalDown / (totalUp + totalDown)) * 100;
                                        return `Total Down: ${totalDownValue.toFixed(2)}% (${totalDown}) bytes`;
                                    }
                                }
                            }
                        }
                    }
                }
            });

        })


        .catch(error => {
            console.error('Error:', error);
        });

}

document.getElementById("logoutbutton")

logoutbutton.addEventListener("click", () =>{
    logout();
})

function logout() {
    localStorage.clear();
    document.getElementById("full-container").style.display = "none";
    document.getElementById("login-container").style.visibility = "visible";
    document.getElementById("personal-info").innerHTML = "";
}