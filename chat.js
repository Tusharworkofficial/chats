// Chatbot functionality
document.addEventListener("DOMContentLoaded", function () {
    // Chatbot functionality
    const chatbotContainer = document.getElementById('chatbot-container');
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotBox = document.getElementById('chatbot-box');
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');

    // Debug log: Check if elements exist
    if (!chatbotContainer || !chatbotToggle || !chatbotBox || !chatbotMessages || !chatbotInput) {
        console.error("One or more chatbot elements are missing!");
        return;
    }

    // Toggle the chat box when clicking the toggle button
    chatbotToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log("Chatbot toggle clicked");  // Debug log
        chatbotBox.classList.toggle('show');
    });

    // Close the chat box if clicking anywhere outside it
    document.addEventListener('click', (e) => {
        if (!chatbotContainer.contains(e.target)) {
            chatbotBox.classList.add('hidden');
        }
    });

    // Prevent clicks inside the chat box from closing it
    chatbotBox.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Function to append a message in the chat window
    const appendMessage = (message, sender = 'user') => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chatbot-message', sender);
        messageDiv.innerText = message;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    };








    // Chatbot response: search the localStorage database ("barcodeDatabase")
    // Updated Chatbot Response Function
    // Updated Chatbot Response Function for Accurate Category Matching
    const getChatbotResponse = (question) => {
        const database = JSON.parse(localStorage.getItem('barcodeDatabase')) || [];
        const lowerQuestion = question.toLowerCase();
        const doc = nlp(question);

        // --- COUNT QUERY ---
        if (lowerQuestion.includes("how many entries")) {
            return `There are ${database.length} entries in the database.`;
        }

        // --- SHOW ALL / LIST ALL ENTRIES ---
        if (
            lowerQuestion.includes("show all entries") ||
            lowerQuestion.includes("list all items") ||
            lowerQuestion.includes("list all entries") ||
            lowerQuestion.includes("show all items")
        ) {
            let response = `All ${database.length} entries:\n`;
            database.forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}, Quantity: ${entry.quantity}, Unit: ${entry.unit}, Expiry Date: ${entry.expiryDate}, Supplier: ${entry.supplierDetails}, Category: ${entry.category}, Batch: ${entry.batch}, Cost per Unit: ${entry.costPerUnit}, Manufacturer: ${entry.manufacturerName}\n`;
            });
            return response;
        }

        // --- EXPIRED ENTRIES ---
        if (lowerQuestion.includes("expired")) {
            const results = database.filter(entry => moment(entry.expiryDate).isBefore(moment()));
            if (results.length > 0) {
                let response = `Expired entries (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Expiry Date: ${moment(entry.expiryDate).format('YYYY-MM-DD')}\n`;
                });
                return response;
            } else {
                return "No expired entries found.";
            }
        }

        // --- ENTRIES EXPIRING SOON (within 7 days) ---
        if (lowerQuestion.includes("expiring soon")) {
            const results = database.filter(entry => {
                const expiry = moment(entry.expiryDate);
                return expiry.isAfter(moment()) && expiry.diff(moment(), 'days') <= 7;
            });
            if (results.length > 0) {
                let response = `Entries expiring within 7 days (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Expiry Date: ${moment(entry.expiryDate).format('YYYY-MM-DD')}\n`;
                });
                return response;
            } else {
                return "No entries expiring soon.";
            }
        }

        // --- SPECIFIC EXPIRY DATE (e.g., "expiry date: 2024-12-31") ---
        if (lowerQuestion.includes("expiry date:")) {
            const regex = /expiry date\s*[:\-]\s*(\d{4}-\d{2}-\d{2})/i;
            const match = question.match(regex);
            if (match && match[1]) {
                const targetDate = moment(match[1], 'YYYY-MM-DD');
                const results = database.filter(entry => moment(entry.expiryDate).isSame(targetDate, 'day'));
                if (results.length > 0) {
                    let response = `Entries with expiry date ${targetDate.format('YYYY-MM-DD')} (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with expiry date ${targetDate.format('YYYY-MM-DD')}.`;
                }
            }
        }

        // --- DATE RANGE QUERY (e.g., "between 2024-01-01 and 2024-12-31") ---
        const dateRangeMatch = question.match(/between\s+(\d{4}-\d{2}-\d{2})\s+and\s+(\d{4}-\d{2}-\d{2})/i);
        if (dateRangeMatch) {
            const startDate = moment(dateRangeMatch[1], 'YYYY-MM-DD');
            const endDate = moment(dateRangeMatch[2], 'YYYY-MM-DD');
            const results = database.filter(entry => {
                const entryDate = moment(entry.timestamp);
                return entryDate.isBetween(startDate, endDate, null, '[]');
            });
            if (results.length > 0) {
                let response = `Entries between ${startDate.format('YYYY-MM-DD')} and ${endDate.format('YYYY-MM-DD')} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return `No entries found between ${startDate.format('YYYY-MM-DD')} and ${endDate.format('YYYY-MM-DD')}.`;
            }
        }

        // --- LATEST / MOST RECENT ENTRIES ---
        if (lowerQuestion.includes("latest") || lowerQuestion.includes("most recent")) {
            const sorted = database.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const count = Math.min(sorted.length, 5);
            let response = `The ${count} most recent entries:\n`;
            sorted.slice(0, count).forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
            });
            return response;
        }

        // --- QUANTITY QUERIES ---
        // Exact quantity: e.g., "quantity: 50"
        if (lowerQuestion.includes("quantity:")) {
            const regex = /quantity\s*[:\-]\s*(\d+)/i;
            const match = question.match(regex);
            if (match && match[1]) {
                const targetQty = Number(match[1]);
                const results = database.filter(entry => Number(entry.quantity) === targetQty);
                if (results.length > 0) {
                    let response = `Entries with quantity ${targetQty} (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with quantity ${targetQty}.`;
                }
            }
        }
        // Quantity greater than
        const qtyGreaterMatch = question.match(/quantity\s+greater\s+than\s+(\d+)/i);
        if (qtyGreaterMatch) {
            const target = Number(qtyGreaterMatch[1]);
            const results = database.filter(entry => Number(entry.quantity) > target);
            if (results.length > 0) {
                let response = `Entries with quantity greater than ${target} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
                });
                return response;
            } else {
                return `No entries found with quantity greater than ${target}.`;
            }
        }
        // Quantity less than
        const qtyLessMatch = question.match(/quantity\s+less\s+than\s+(\d+)/i);
        if (qtyLessMatch) {
            const target = Number(qtyLessMatch[1]);
            const results = database.filter(entry => Number(entry.quantity) < target);
            if (results.length > 0) {
                let response = `Entries with quantity less than ${target} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
                });
                return response;
            } else {
                return `No entries found with quantity less than ${target}.`;
            }
        }
        // Quantity between e.g., "quantity between 50 and 150"
        const qtyBetweenMatch = question.match(/quantity\s+between\s+(\d+)\s+and\s+(\d+)/i);
        if (qtyBetweenMatch) {
            const lowerBound = Number(qtyBetweenMatch[1]);
            const upperBound = Number(qtyBetweenMatch[2]);
            const results = database.filter(entry => {
                const qty = Number(entry.quantity);
                return qty >= lowerBound && qty <= upperBound;
            });
            if (results.length > 0) {
                let response = `Entries with quantity between ${lowerBound} and ${upperBound} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
                });
                return response;
            } else {
                return `No entries found with quantity between ${lowerBound} and ${upperBound}.`;
            }
        }

        // --- COST PER UNIT QUERIES ---
        // Exact cost per unit: e.g., "cost per unit: 20"
        if (lowerQuestion.includes("cost per unit:")) {
            const regex = /cost per unit\s*[:\-]\s*(\d+(\.\d+)?)/i;
            const match = question.match(regex);
            if (match && match[1]) {
                const targetCost = parseFloat(match[1]);
                const results = database.filter(entry => parseFloat(entry.costPerUnit) === targetCost);
                if (results.length > 0) {
                    let response = `Entries with cost per unit ${targetCost} (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with cost per unit ${targetCost}.`;
                }
            }
        }
        // Cost greater than
        const costGreaterMatch = question.match(/cost per unit\s+greater\s+than\s+(\d+(\.\d+)?)/i);
        if (costGreaterMatch) {
            const target = parseFloat(costGreaterMatch[1]);
            const results = database.filter(entry => parseFloat(entry.costPerUnit) > target);
            if (results.length > 0) {
                let response = `Entries with cost per unit greater than ${target} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return `No entries found with cost per unit greater than ${target}.`;
            }
        }
        // Cost less than
        const costLessMatch = question.match(/cost per unit\s+less\s+than\s+(\d+(\.\d+)?)/i);
        if (costLessMatch) {
            const target = parseFloat(costLessMatch[1]);
            const results = database.filter(entry => parseFloat(entry.costPerUnit) < target);
            if (results.length > 0) {
                let response = `Entries with cost per unit less than ${target} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return `No entries found with cost per unit less than ${target}.`;
            }
        }
        // Cost between e.g., "cost per unit between 10 and 50"
        const costBetweenMatch = question.match(/cost per unit\s+between\s+(\d+(\.\d+)?)\s+and\s+(\d+(\.\d+)?)/i);
        if (costBetweenMatch) {
            const lowerBound = parseFloat(costBetweenMatch[1]);
            const upperBound = parseFloat(costBetweenMatch[3]);
            const results = database.filter(entry => {
                const cost = parseFloat(entry.costPerUnit);
                return cost >= lowerBound && cost <= upperBound;
            });
            if (results.length > 0) {
                let response = `Entries with cost per unit between ${lowerBound} and ${upperBound} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return `No entries found with cost per unit between ${lowerBound} and ${upperBound}.`;
            }
        }
        // Cost within 5% of a given value, e.g., "cost per unit within 5% of 50"
        const costWithinMatch = question.match(/cost per unit\s+within\s+5%\s+of\s+(\d+(\.\d+)?)/i);
        if (costWithinMatch) {
            const base = parseFloat(costWithinMatch[1]);
            const lowerBound = base * 0.95;
            const upperBound = base * 1.05;
            const results = database.filter(entry => {
                const cost = parseFloat(entry.costPerUnit);
                return cost >= lowerBound && cost <= upperBound;
            });
            if (results.length > 0) {
                let response = `Entries with cost per unit within 5% of ${base} (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return `No entries found with cost per unit within 5% of ${base}.`;
            }
        }
        // Cost less than average cost
        if (lowerQuestion.includes("cost per unit less than the average cost")) {
            const total = database.reduce((sum, entry) => sum + parseFloat(entry.costPerUnit), 0);
            const avg = total / (database.length || 1);
            const results = database.filter(entry => parseFloat(entry.costPerUnit) < avg);
            if (results.length > 0) {
                let response = `Average cost per unit is ${avg.toFixed(2)}. Entries with cost per unit less than the average (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return `No entries found with cost per unit less than the average (${avg.toFixed(2)}).`;
            }
        }
        // Top 10 most expensive items
        if (lowerQuestion.includes("top 10 most expensive items")) {
            const sorted = database.sort((a, b) => parseFloat(b.costPerUnit) - parseFloat(a.costPerUnit));
            const results = sorted.slice(0, 10);
            let response = `Top 10 most expensive items:\n`;
            results.forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
            });
            return response;
        }

        // --- SUPPLIER QUERIES ---
        const supplierMatch = question.match(/supplier\s*(contains|starts with|ends with)?\s*[:\-]?\s*(.+)/i);
        if (supplierMatch) {
            const mode = supplierMatch[1] ? supplierMatch[1].toLowerCase() : 'exact';
            const searchTerm = supplierMatch[2].trim();
            const results = database.filter(entry => {
                if (!entry.supplierDetails) return false;
                const value = entry.supplierDetails.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for supplier (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Supplier: ${entry.supplierDetails}\n`;
                });
                return response;
            } else {
                return `No entries found for supplier (${mode}) "${searchTerm}".`;
            }
        }

        // --- BATCH QUERIES ---
        const batchMatch = question.match(/batch\s*(contains|starts with|ends with)?\s*[:\-]?\s*(.+)/i);
        if (batchMatch) {
            const mode = batchMatch[1] ? batchMatch[1].toLowerCase() : 'exact';
            const searchTerm = batchMatch[2].trim();
            const results = database.filter(entry => {
                if (!entry.batch) return false;
                const value = entry.batch.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for batch (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Batch: ${entry.batch}\n`;
                });
                return response;
            } else {
                return `No entries found for batch (${mode}) "${searchTerm}".`;
            }
        }
        // Numeric batch numbers only
        if (lowerQuestion.includes("numeric batch numbers only")) {
            const results = database.filter(entry => /^[0-9]+$/.test(entry.batch));
            if (results.length > 0) {
                let response = `Entries with numeric batch numbers (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Batch: ${entry.batch}\n`;
                });
                return response;
            } else {
                return "No entries found with numeric batch numbers only.";
            }
        }

        // --- MANUFACTURER QUERIES ---
        const manufacturerMatch = question.match(/manufacturer\s*(contains|starts with|ends with)?\s*(exactly)?\s*[:\-]?\s*(.+)/i);
        if (manufacturerMatch) {
            const mode = manufacturerMatch[1] ? manufacturerMatch[1].toLowerCase() : 'exact';
            const searchTerm = manufacturerMatch[4].trim();
            const results = database.filter(entry => {
                if (!entry.manufacturerName) return false;
                const value = entry.manufacturerName.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for manufacturer (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Manufacturer: ${entry.manufacturerName}\n`;
                });
                return response;
            } else {
                return `No entries found for manufacturer (${mode}) "${searchTerm}".`;
            }
        }

        // --- CATEGORY QUERIES ---
        const categoryMatch = question.match(/category\s*(contains|starts with|ends with)?\s*[:\-]?\s*(.+)/i);
        if (categoryMatch) {
            const mode = categoryMatch[1] ? categoryMatch[1].toLowerCase() : 'exact';
            const searchTerm = categoryMatch[2].trim();
            const results = database.filter(entry => {
                if (!entry.category) return false;
                const value = entry.category.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for category (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Category: ${entry.category}\n`;
                });
                return response;
            } else {
                return `No entries found for category (${mode}) "${searchTerm}".`;
            }
        }

        // --- UNIT QUERIES ---
        if (lowerQuestion.includes("unit:")) {
            const regex = /unit\s*[:\-]\s*(\w+)/i;
            const match = question.match(regex);
            if (match && match[1]) {
                const targetUnit = match[1].toLowerCase();
                const results = database.filter(entry => entry.unit && entry.unit.toLowerCase() === targetUnit);
                if (results.length > 0) {
                    let response = `Entries with unit "${targetUnit}" (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Unit: ${entry.unit}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with unit "${targetUnit}".`;
                }
            }
        }
        if (lowerQuestion.includes("unit not equal to")) {
            const regex = /unit not equal to\s*[:\-]?\s*(\w+)/i;
            const match = question.match(regex);
            if (match && match[1]) {
                const targetUnit = match[1].toLowerCase();
                const results = database.filter(entry => entry.unit && entry.unit.toLowerCase() !== targetUnit);
                if (results.length > 0) {
                    let response = `Entries with unit not equal to "${targetUnit}" (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Unit: ${entry.unit}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with unit not equal to "${targetUnit}".`;
                }
            }
        }

        // --- MISSING MANUFACTURER NAMES ---
        if (lowerQuestion.includes("missing manufacturer") || lowerQuestion.includes("n/a manufacturer")) {
            const results = database.filter(entry => !entry.manufacturerName || entry.manufacturerName.toLowerCase() === 'n/a');
            if (results.length > 0) {
                let response = `Entries with missing or "N/A" manufacturer names (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}\n`;
                });
                return response;
            } else {
                return "No entries found with missing or 'N/A' manufacturer names.";
            }
        }

        // --- UPDATED IN LAST 24 HOURS ---
        if (lowerQuestion.includes("updated in the last 24 hours")) {
            const results = database.filter(entry => {
                const diff = moment().diff(moment(entry.timestamp), 'hours');
                return diff <= 24;
            });
            if (results.length > 0) {
                let response = `Entries updated in the last 24 hours (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return "No entries found that were updated in the last 24 hours.";
            }
        }

        // --- TIMESTAMPS FROM LAST 7 DAYS ---
        if (lowerQuestion.includes("timestamps from the last 7 days")) {
            const results = database.filter(entry => {
                const diff = moment().diff(moment(entry.timestamp), 'days');
                return diff < 7;
            });
            if (results.length > 0) {
                let response = `Entries from the last 7 days (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return "No entries found from the last 7 days.";
            }
        }

        // --- CREATED IN LAST MONTH ---
        if (lowerQuestion.includes("created in the last month")) {
            const results = database.filter(entry => {
                const diff = moment().diff(moment(entry.timestamp), 'days');
                return diff < 30;
            });
            if (results.length > 0) {
                let response = `Entries created in the last month (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return "No entries found that were created in the last month.";
            }
        }

        // --- SORTING QUERIES ---
        // Sorted by quantity in descending order
        if (lowerQuestion.includes("sorted by quantity in descending order")) {
            const sorted = database.sort((a, b) => Number(b.quantity) - Number(a.quantity));
            let response = `Entries sorted by quantity (descending):\n`;
            sorted.forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
            });
            return response;
        }
        // Sorted by expiry date in ascending order
        if (lowerQuestion.includes("sorted by expiry date in ascending order")) {
            const sorted = database.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
            let response = `Entries sorted by expiry date (ascending):\n`;
            sorted.forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Expiry Date: ${moment(entry.expiryDate).format('YYYY-MM-DD')}\n`;
            });
            return response;
        }

        // --- MATERIAL ID QUERIES ---
        const materialIdMatch = question.match(/material id\s*(contains|starts with|ends with)?\s*[:\-]?\s*(.+)/i);
        if (materialIdMatch) {
            const mode = materialIdMatch[1] ? materialIdMatch[1].toLowerCase() : 'exact';
            const searchTerm = materialIdMatch[2].trim();
            const results = database.filter(entry => {
                if (!entry.materialId) return false;
                const value = entry.materialId.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for material id (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
                });
                return response;
            } else {
                return `No entries found for material id (${mode}) "${searchTerm}".`;
            }
        }

        // --- MATERIAL NAME QUERIES ---
        const materialNameMatch = question.match(/material name\s*(contains|starts with|ends with)?\s*[:\-]?\s*(.+)/i);
        if (materialNameMatch) {
            const mode = materialNameMatch[1] ? materialNameMatch[1].toLowerCase() : 'exact';
            const searchTerm = materialNameMatch[2].trim();
            const results = database.filter(entry => {
                if (!entry.materialName) return false;
                const value = entry.materialName.toLowerCase();
                const term = searchTerm.toLowerCase();
                if (mode === 'contains') return value.includes(term);
                if (mode === 'starts with') return value.startsWith(term);
                if (mode === 'ends with') return value.endsWith(term);
                return value === term;
            });
            if (results.length > 0) {
                let response = `Entries for material name (${mode}) "${searchTerm}" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material Name: ${entry.materialName}, Material ID: ${entry.materialId}\n`;
                });
                return response;
            } else {
                return `No entries found for material name (${mode}) "${searchTerm}".`;
            }
        }

        // --- COMBINED SUPPLIER AND CATEGORY QUERY ---
        if (lowerQuestion.includes("supplier") && lowerQuestion.includes("category")) {
            const supplierRegex = /supplier\s*[:\-]?\s*["']?([\w\s]+)["']?/i;
            const categoryRegex = /category\s*[:\-]?\s*["']?([\w\s]+)["']?/i;
            const supplierMatch = question.match(supplierRegex);
            const categoryMatch = question.match(categoryRegex);
            if (supplierMatch && categoryMatch) {
                const supplierTerm = supplierMatch[1].trim().toLowerCase();
                const categoryTerm = categoryMatch[1].trim().toLowerCase();
                const results = database.filter(entry => {
                    return entry.supplierDetails && entry.supplierDetails.toLowerCase() === supplierTerm &&
                        entry.category && entry.category.toLowerCase() === categoryTerm;
                });
                if (results.length > 0) {
                    let response = `Entries with supplier "${supplierTerm}" and category "${categoryTerm}" (${results.length}):\n`;
                    results.forEach((entry, index) => {
                        response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
                    });
                    return response;
                } else {
                    return `No entries found with supplier "${supplierTerm}" and category "${categoryTerm}".`;
                }
            }
        }

        // --- QUANTITY ABOVE STANDARD REORDER LEVEL ---
        if (lowerQuestion.includes("quantity above the standard reorder level")) {
            const results = database.filter(entry => entry.reorderLevel !== undefined && Number(entry.quantity) > Number(entry.reorderLevel));
            if (results.length > 0) {
                let response = `Entries with quantity above the standard reorder level (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}, Reorder Level: ${entry.reorderLevel}\n`;
                });
                return response;
            } else {
                return "No entries found with quantity above the standard reorder level.";
            }
        }

        // --- ADDITIONAL ADVANCED QUERIES ---

        // Find entries with duplicate material IDs.
        if (lowerQuestion.includes("duplicate material ids")) {
            let idCount = {};
            database.forEach(entry => {
                const id = entry.materialId ? entry.materialId.toLowerCase() : "";
                idCount[id] = (idCount[id] || 0) + 1;
            });
            const duplicates = database.filter(entry => entry.materialId && idCount[entry.materialId.toLowerCase()] > 1);
            if (duplicates.length > 0) {
                let response = `Entries with duplicate material IDs (${duplicates.length}):\n`;
                duplicates.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
                });
                return response;
            } else {
                return "No duplicate material IDs found.";
            }
        }

        // Display the total count of items grouped by category.
        if (lowerQuestion.includes("total count of items grouped by category") || lowerQuestion.includes("count items by category")) {
            let group = {};
            database.forEach(entry => {
                const cat = entry.category ? entry.category.toLowerCase() : "unknown";
                group[cat] = (group[cat] || 0) + 1;
            });
            let response = "Total count of items grouped by category:\n";
            for (const cat in group) {
                response += `Category "${cat}": ${group[cat]} items\n`;
            }
            return response;
        }

        // Show the average cost per unit for each category.
        if (lowerQuestion.includes("average cost per unit for each category") || lowerQuestion.includes("avg cost per unit by category")) {
            let group = {};
            database.forEach(entry => {
                const cat = entry.category ? entry.category.toLowerCase() : "unknown";
                const cost = parseFloat(entry.costPerUnit) || 0;
                if (!group[cat]) {
                    group[cat] = { total: 0, count: 0 };
                }
                group[cat].total += cost;
                group[cat].count += 1;
            });
            let response = "Average cost per unit for each category:\n";
            for (const cat in group) {
                const avg = group[cat].total / group[cat].count;
                response += `Category "${cat}": ${avg.toFixed(2)}\n`;
            }
            return response;
        }

        // List entries with the highest quantity in stock.
        if (lowerQuestion.includes("highest quantity in stock") || lowerQuestion.includes("max quantity")) {
            if (database.length === 0) return "No entries in the database.";
            let maxQty = Math.max(...database.map(entry => Number(entry.quantity)));
            const results = database.filter(entry => Number(entry.quantity) === maxQty);
            let response = `Entries with the highest quantity in stock (${maxQty}):\n`;
            results.forEach((entry, index) => {
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
            });
            return response;
        }

        // Find entries added on weekends.
        if (lowerQuestion.includes("added on weekends") || lowerQuestion.includes("created on weekends")) {
            const results = database.filter(entry => {
                const day = moment(entry.timestamp).day(); // Sunday = 0, Saturday = 6
                return day === 0 || day === 6;
            });
            if (results.length > 0) {
                let response = `Entries added on weekends (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Timestamp: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return "No entries found that were added on weekends.";
            }
        }

        // Show entries that have not been updated in over six months.
        if (lowerQuestion.includes("not been updated in over six months") || lowerQuestion.includes("not updated in over six months")) {
            const sixMonthsAgo = moment().subtract(6, 'months');
            const results = database.filter(entry => moment(entry.timestamp).isBefore(sixMonthsAgo));
            if (results.length > 0) {
                let response = `Entries not updated in over six months (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Last Updated: ${new Date(entry.timestamp).toLocaleString()}\n`;
                });
                return response;
            } else {
                return "All entries have been updated within the last six months.";
            }
        }

        // List entries with duplicate batch numbers.
        if (lowerQuestion.includes("duplicate batch numbers")) {
            let batchCount = {};
            database.forEach(entry => {
                if (entry.batch) {
                    let batch = entry.batch.toLowerCase();
                    batchCount[batch] = (batchCount[batch] || 0) + 1;
                }
            });
            const duplicates = database.filter(entry => entry.batch && batchCount[entry.batch.toLowerCase()] > 1);
            if (duplicates.length > 0) {
                let response = `Entries with duplicate batch numbers (${duplicates.length}):\n`;
                duplicates.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Batch: ${entry.batch}\n`;
                });
                return response;
            } else {
                return "No duplicate batch numbers found.";
            }
        }

        // Find entries with missing or empty supplier details.
        if (lowerQuestion.includes("missing supplier details") || lowerQuestion.includes("empty supplier details")) {
            const results = database.filter(entry => !entry.supplierDetails || entry.supplierDetails.trim() === "");
            if (results.length > 0) {
                let response = `Entries with missing or empty supplier details (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}\n`;
                });
                return response;
            } else {
                return "No entries found with missing or empty supplier details.";
            }
        }

        // Display the median cost per unit across all entries.
        if (lowerQuestion.includes("median cost per unit")) {
            const costs = database.map(entry => parseFloat(entry.costPerUnit)).filter(cost => !isNaN(cost));
            if (costs.length === 0) return "No cost data available.";
            costs.sort((a, b) => a - b);
            let median;
            const mid = Math.floor(costs.length / 2);
            if (costs.length % 2 === 0) {
                median = (costs[mid - 1] + costs[mid]) / 2;
            } else {
                median = costs[mid];
            }
            return `The median cost per unit across all entries is ${median.toFixed(2)}.`;
        }

        // List entries where the cost per unit falls in the top 5% of all items.
        if (lowerQuestion.includes("top 5%") && lowerQuestion.includes("cost per unit")) {
            const costs = database.map(entry => parseFloat(entry.costPerUnit)).filter(cost => !isNaN(cost));
            if (costs.length === 0) return "No cost data available.";
            costs.sort((a, b) => a - b);
            const index = Math.floor(0.95 * costs.length);
            const threshold = costs[index];
            const results = database.filter(entry => parseFloat(entry.costPerUnit) >= threshold);
            if (results.length > 0) {
                let response = `Entries with cost per unit in the top 5% (threshold: ${threshold.toFixed(2)}) (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Cost per Unit: ${entry.costPerUnit}\n`;
                });
                return response;
            } else {
                return "No entries found in the top 5% for cost per unit.";
            }
        }

        // Generate a summary report of total quantities grouped by unit type.
        if (lowerQuestion.includes("total quantities grouped by unit type") || lowerQuestion.includes("summary report of total quantities by unit")) {
            let summary = {};
            database.forEach(entry => {
                const unit = entry.unit ? entry.unit.toLowerCase() : "unknown";
                summary[unit] = (summary[unit] || 0) + Number(entry.quantity);
            });
            let response = "Total quantities grouped by unit type:\n";
            for (const unit in summary) {
                response += `Unit "${unit}": ${summary[unit]}\n`;
            }
            return response;
        }

        // Find entries where the material name contains special characters.
        if (lowerQuestion.includes("material name contains special characters")) {
            const results = database.filter(entry => entry.materialName && /[^a-zA-Z0-9\s]/.test(entry.materialName));
            if (results.length > 0) {
                let response = `Entries where material name contains special characters (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material Name: ${entry.materialName}\n`;
                });
                return response;
            } else {
                return "No entries found with special characters in the material name.";
            }
        }

        // Identify entries with inconsistent data formats (e.g., invalid expiry dates).
        if (lowerQuestion.includes("inconsistent data formats") || lowerQuestion.includes("invalid expiry dates")) {
            const results = database.filter(entry => {
                return entry.expiryDate && !moment(entry.expiryDate, 'YYYY-MM-DD', true).isValid();
            });
            if (results.length > 0) {
                let response = `Entries with invalid expiry date formats (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Expiry Date: ${entry.expiryDate}\n`;
                });
                return response;
            } else {
                return "No entries found with inconsistent expiry date formats.";
            }
        }

        // List entries with a negative quantity (if applicable).
        if (lowerQuestion.includes("negative quantity")) {
            const results = database.filter(entry => Number(entry.quantity) < 0);
            if (results.length > 0) {
                let response = `Entries with negative quantity (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Quantity: ${entry.quantity}\n`;
                });
                return response;
            } else {
                return "No entries found with negative quantity.";
            }
        }

        // Find entries where supplier details include both "inc" and "llc".
        if (lowerQuestion.includes("supplier details include both") && lowerQuestion.includes("inc") && lowerQuestion.includes("llc")) {
            const results = database.filter(entry => {
                if (!entry.supplierDetails) return false;
                const details = entry.supplierDetails.toLowerCase();
                return details.includes("inc") && details.includes("llc");
            });
            if (results.length > 0) {
                let response = `Entries where supplier details include both "Inc." and "LLC" (${results.length}):\n`;
                results.forEach((entry, index) => {
                    response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Supplier Details: ${entry.supplierDetails}\n`;
                });
                return response;
            } else {
                return "No entries found where supplier details include both 'Inc.' and 'LLC'.";
            }
        }

        // --- FALLBACK: Fuse.js Fuzzy Search ---
        const fuseOptions = {
            keys: ['materialId', 'materialName', 'category', 'supplierDetails', 'batch', 'manufacturerName'],
            threshold: 0.3,
        };
        const fuse = new Fuse(database, fuseOptions);
        const fuseResults = fuse.search(question.toLowerCase());
        if (fuseResults.length > 0) {
            let response = `Fuzzy search found ${fuseResults.length} entries:\n`;
            fuseResults.forEach((result, index) => {
                const entry = result.item;
                response += `Entry ${index + 1}: Material ID: ${entry.materialId}, Material Name: ${entry.materialName}\n`;
            });
            return response;
        }

        return "I'm sorry, I couldn't find any matching information in the database. Could you please rephrase or provide more details?";
    };



















    // Handle sending a message when the user presses Enter
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && chatbotInput.value.trim() !== '') {
            const userQuestion = chatbotInput.value.trim();
            appendMessage(userQuestion, 'user');
            chatbotInput.value = '';

            // Simulate a short delay before the bot responds
            setTimeout(() => {
                const response = getChatbotResponse(userQuestion);
                appendMessage(response, 'bot');
            }, 500);
        }
    });
});