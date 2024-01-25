
exports.Response = (res, code, message, {data, total,custom}) => {
    // Construct the Record object
    let Record = {};
    let status = code < 300 ? "SUCCESS" : "ERROR";
  
    // Add tableData to the Record object if it's provided
    if (data !== undefined) {
      Record.data = data;
      //   Record.tableData = data;
    }
  
    // Add total to the Record object if it's provided
    if (total !== undefined) {
      Record.total = total;
    }
    if(custom){
      Record.custom = custom;
    }
  
    // Return the response
    return res.status(code).json({ ...Record, status, message });
    //   return res.status(code).json({ Record,status,message});
  };
  
  
  