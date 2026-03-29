/* Function to calculate simple interest */
function calculateSI()
{
    // Get values from input fields
    var p = parseFloat(document.getElementById("principal").value);
    var r = parseFloat(document.getElementById("rate").value);
    var t = parseFloat(document.getElementById("time").value);

    // Check if all fields are filled properly
    if (isNaN(p) || isNaN(r) || isNaN(t))
    {
        document.getElementById("result").innerHTML = "Please enter all values correctly";
        return;
    }

    // Call separate function to find SI
    var si = findSI(p, r, t);

    // Display result
    document.getElementById("result").innerHTML = "Simple Interest = " + si;
}

/* Function for SI formula */
function findSI(p, r, t)
{
    // Formula: SI = (P × R × T) / 100
    var result = (p * r * t) / 100;

    // Return calculated value
    return result;
}