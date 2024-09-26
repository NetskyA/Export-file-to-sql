// Show/hide the custom file name input
document.getElementById('customNameCheckbox').addEventListener('change', function() {
    var customNameInput = document.getElementById('customNameInput');
    if (this.checked) {
        customNameInput.classList.remove('hidden');
    } else {
        customNameInput.classList.add('hidden');
    }
});

// Convert button logic
document.getElementById('convertBtn').addEventListener('click', function () {
    var fileInput = document.getElementById('fileUpload');
    var customNameCheckbox = document.getElementById('customNameCheckbox');
    var fileNameInput = document.getElementById('fileName');
    var output = document.getElementById('output');
    var fileName;

    // Get current date in dd-mm-yyyy format
    var currentDate = new Date();
    var day = String(currentDate.getDate()).padStart(2, '0');
    var month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    var year = currentDate.getFullYear();
    var formattedDate = `${day}-${month}-${year}`;

    if (customNameCheckbox.checked && fileNameInput.value.trim() !== '') {
        // Use custom file name if checkbox is checked and input is not empty
        fileName = fileNameInput.value.trim() + '.sql';
    } else {
        // Default file name with date
        fileName = `file_convert_${formattedDate}.sql`;
    }

    if (fileInput.files.length > 0) {
        var file = fileInput.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
            var data = new Uint8Array(e.target.result);
            var workbook = XLSX.read(data, { type: 'array' });

            var sheetName = workbook.SheetNames[0];
            var worksheet = workbook.Sheets[sheetName];
            var json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            var tableName = "YourTableName"; // Ganti dengan nama tabelmu
            var sqlStatements = jsonToSQL(json, tableName);

            // Display the SQL queries in the output
            output.textContent = sqlStatements.join("\n");

            // Trigger the download of the SQL file
            downloadSQLFile(sqlStatements.join("\n"), fileName);
        };

        reader.readAsArrayBuffer(file);
    } else {
        alert("Please select a file first.");
    }
});

function jsonToSQL(json, tableName) {
    var sql = [];
    if (json.length > 0) {
        var headers = json[0];

        headers = headers.map(function (header) {
            if (header && typeof header === 'string' && header.trim() !== '') {
                return '`' + header.trim().replace(/'/g, "''") + '`';
            }
            return '';  // Ignore empty headers
        }).filter(header => header !== ''); // Remove empty headers

        for (var i = 1; i < json.length; i++) {
            var row = json[i];
            var values = row.map(function (val) {
                if (typeof val === 'string') {
                    return `'${val.replace(/'/g, "''")}'`;
                } else if (val === null || val === undefined || val === '') {
                    return 'NULL';  
                } else {
                    return val;
                }
            });

            var filteredValues = values.filter((val, idx) => headers[idx] !== '');
            sql.push(`INSERT INTO ${tableName} (${headers.join(", ")}) VALUES (${filteredValues.join(", ")});`);
        }
    }
    return sql;
}

function downloadSQLFile(content, filename) {
    var blob = new Blob([content], { type: 'text/sql' });
    var link = document.createElement('a');
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(function () {
        window.location.reload();
    }, 1500);
}
