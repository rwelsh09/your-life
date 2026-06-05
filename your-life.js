/**
 * Interactive form and chart events / logic.
 */
(function () {
  var dobEl = document.getElementById('dob'),
    unitboxEl = document.getElementById('unitbox'),
    unitText = document.querySelector('.unitbox-label').textContent.toLowerCase(),
    items = document.querySelectorAll('.chart li'),
    itemCount,
    columnInput = document.getElementById('columns'),
    chartGrid = document.querySelector('.chart'),
    COLOR = 'red';

  var picker = new Pikaday({
    field: dobEl,
    yearRange: [1900, new Date().getFullYear()], // Sets the range for the Year dropdown
    toString: function(date, format) {
      // This forces the calendar to output "YYYY-MM-DD" without needing external libraries
      var day = String(date.getDate()).padStart(2, '0');
      var month = String(date.getMonth() + 1).padStart(2, '0');
      var year = date.getFullYear();
      return year + '-' + month + '-' + day;
    },
    onSelect: function() {
      // When a user clicks a date, instantly run your update function
      _handleDateChange(); 
    }
  });

  // Set listeners
  unitboxEl.addEventListener('change', _handleUnitChange);
  dobEl.addEventListener('input', _handleDateChange);
  dobEl.addEventListener('blur', _unhideValidationStyles);

  // Load default values
  _loadStoredValueOfDOB();

  // Event Handlers
  function _handleUnitChange(e) {
    window.location = '' + e.currentTarget.value + '.html';
  }

  function _handleDateChange() {
    // Save date of birth in local storage
    localStorage.setItem("DOB", JSON.stringify({
      dob: dobEl.value
    }));

    if (_dateIsValid()) {
      dobEl.classList.add('touched');
      itemCount = _calculateElapsedTime();
      _repaintItems(itemCount);
    } else {
      _repaintItems(0);
    }
  }

  function _unhideValidationStyles() {
    if (dobEl) {
      dobEl.classList.add('touched');
    }
  }

  function _calculateElapsedTime() {
    var currentDate = new Date(),
      dateOfBirth = _getDateOfBirth(),
      diff = currentDate.getTime() - dateOfBirth.getTime(),
      elapsedTime;

    switch (unitText) {
      case 'weeks':
        var elapsedYears = (new Date(diff).getUTCFullYear() - 1970);
        
        // Extract month and day from the new dateOfBirth object
        var dobMonth = dateOfBirth.getMonth();
        var dobDate = dateOfBirth.getDate();

        var isThisYearsBirthdayPassed = (currentDate.getTime() > new Date(currentDate.getFullYear(), dobMonth, dobDate).getTime());
        var birthdayYearOffset = isThisYearsBirthdayPassed ? 0 : 1;
        var dateOfLastBirthday = new Date(currentDate.getFullYear() - birthdayYearOffset, dobMonth, dobDate);
        var elapsedDaysSinceLastBirthday = Math.floor((currentDate.getTime() - dateOfLastBirthday.getTime()) / (1000 * 60 * 60 * 24));
        var elapsedWeeks = (elapsedYears * 52) + Math.floor(elapsedDaysSinceLastBirthday / 7);
        elapsedTime = elapsedWeeks;
        break;
      case 'months':
        elapsedTime = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.4375));
        break;
      case 'years':
        elapsedTime = (new Date(diff).getUTCFullYear() - 1970);
        break;
    }

    return elapsedTime;
  }

  function _dateIsValid() {
    return dobEl.checkValidity() && dobEl.value !== '';
  }

  function _getDateOfBirth() {
    var parts = dobEl.value.split('-');
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }

  function _repaintItems(number) {
    for (var i = 0; i < items.length; i++) {
      if (i < number) {
        items[i].style.backgroundColor = COLOR;
      } else {
        items[i].style.backgroundColor = '';
      }
    }
  }

  function _loadStoredValueOfDOB() {
    var DOB = JSON.parse(localStorage.getItem('DOB'));

    if (!DOB) return;

    if (DOB.dob) {
      dobEl.value = DOB.dob;
      // Tell Pikaday to update its internal calendar to match this date
      var parts = DOB.dob.split('-');
      // The "true" prevents an infinite loop on load
      picker.setDate(new Date(parts[0], parts[1] - 1, parts[2]), true); 
    } 
    else if (DOB.year && DOB.month !== undefined && DOB.day) {
      // Legacy fallback
      var mm = String(parseInt(DOB.month) + 1).padStart(2, '0');
      var dd = String(DOB.day).padStart(2, '0');
      dobEl.value = DOB.year + '-' + mm + '-' + dd;
      picker.setDate(new Date(DOB.year, DOB.month, DOB.day), true);
    }

    if (_dateIsValid()) {
      _unhideValidationStyles();
      itemCount = _calculateElapsedTime();
      _repaintItems(itemCount);
    }
  }

  function updateGridColumns() {
    if (!columnInput || !chartGrid) return; 
    
    const colCount = parseInt(columnInput.value, 10);
    chartGrid.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`; 

    // --- NEW: Scale grid to fit entirely within the viewport ---
    const totalItems = chartGrid.querySelectorAll('li').length;
    const rowCount = Math.ceil(totalItems / colCount);
    const availableHeight = window.innerHeight * 0.70; 
    const gapSize = parseFloat(window.getComputedStyle(chartGrid).gap) || 2;
    const cellSize = (availableHeight - ((rowCount - 1) * gapSize)) / rowCount;

    if (cellSize > 0) {
      const optimalWidth = (colCount * cellSize) + ((colCount - 1) * gapSize);
      chartGrid.style.maxWidth = `min(100%, ${optimalWidth}px)`;
    }

    // --- AXIS TOGGLE ---
    const xAxis = document.querySelector('.x-axis');
    const yAxis = document.querySelector('.y-axis');

    if (xAxis && yAxis) {
      if (colCount === 52) {
        xAxis.style.display = 'block';
        yAxis.style.display = 'block';
      } else {
        xAxis.style.display = 'none';
        yAxis.style.display = 'none';
      }
    }
  }

  // Bind the resize event so the chart recalculates if the window is resized
  if (columnInput) {
    columnInput.addEventListener('input', updateGridColumns);
    window.addEventListener('resize', updateGridColumns);
    updateGridColumns();
  }
})();