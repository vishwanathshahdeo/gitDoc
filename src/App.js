
import React, {Component } from 'react';
import axios from 'axios';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pdf from "react-to-pdf";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

class App extends Component {
  state={
    username:'',
    dateFrom: new Date(),
    dateF:'',
    dateTo:new Date(),
    dateT: '',
    sLowerIndex:-1,
    sUpperIndex:-1,
    pdfdata : [],
    commitdata : []
  }
// search algorithm
  lowerIndex = (list, start, end, sv, comparator) => {
	
    var left = start;
    var right = end;
    
    while(left<=right){		
      console.log(left,right);
      var mid = Math.floor(left + ((right-left)/2));
      console.log(mid, list[mid]);
      if(comparator(list[mid],sv) <=0 ){
        right = mid-1;			
      }else{
        left = mid+1;
      }
    }
    return left;
  }
  
  upperIndex =(list, start, end, sv, comparator) => {
    
    var left = start;
    var right = end;
    
    while(left<=right){
      
      var mid = Math.floor(left + ((right-left)/2));
  
      if(comparator(list[mid],sv) >=0 ){
        left = mid+1;			
      }else{
        right = mid-1;
      }
    }
    return right;
  }


  search =(list, from, to,comparator) => {
    var lower = this.lowerIndex(list,0,list.length-1, to,comparator);	
    var upper = this.upperIndex(list,0,list.length-1, from,comparator);
    console.log("Range["+lower+"-"+upper+"]");
    if(upper < lower){
      return null;
    }
    return {lower : lower,upper:upper};
  }

  filterEvents = (gevents, from, to) => {
    return this.search(gevents,from,to, 

      function(firstEvent, secondEvent){
        console.log("first",firstEvent, "second",secondEvent);
        var fmilli = Date.parse(firstEvent.created_at);
        var secmilli = Date.parse(secondEvent.created_at);
        return fmilli > secmilli ? 1 : ( secmilli > fmilli ? -1 : 0);
      }
    );
  }

  updateResultIndexes = (l,u) => {
    this.setState({"sLowerIndex": l});
    this.setState({"sUpperIndex": u});
  }

  fetchData =() => {

    if(Date.parse(this.state.dateF) <= Date.parse(this.state.dateT) ){
    axios.get(
      `https://api.github.com/users/${this.state.username}/events`
    ).then(response => {
      if(response.data.length===0){
        return alert("data not found");;
      }
      var result = response.data;
      console.log("values",response.data);
      var oldest = Date.parse(response.data[response.data.length-1].created_at);
      var newest = Date.parse(response.data[0].created_at);
      //range oldest-newest
      var searchFrom = Date.parse(this.state.dateF);
      var searchTo = Date.parse(this.state.dateT);

      if(searchFrom > newest || searchTo < oldest){
        //not active in this period.
        return alert("user not active in this period");
      }
      var resultIndexes = this.filterEvents(
        response.data,
         {"created_at" : this.state.dateF}, //from
         {"created_at" : this.state.dateT} //to
        );
 console.log("resultIndex",resultIndexes);
      this.updateResultIndexes(resultIndexes.lower,resultIndexes.upper);
      var commitdata = [];

       for(var i = resultIndexes.lower; i<=resultIndexes.upper; i++){

        if("commits" in result[i].payload){
          var commits = result[i].payload.commits;
          for(var x=0; x< commits.length; x++){

            commitdata.push({
              date : result[i].created_at,
              message : ("message" in commits[x] ? commits[x].message : "N.A."),
              reponame : result[i].repo.name
            });
          }
        } 
      }
      //if(commitdata.length <= 0){
        //alert("no data found in provided period");
      //}
       console.log("length",result.length);
       console.log("all commit", commitdata);
       this.setState({commitdata : commitdata});
      console.log("=====================", resultIndexes);
    })
  }
  else{
    alert("wrong date range selected");
  }
  }
  userChange = (e)=>{
    this.setState({username:e.target.value});
    console.log("name",this.state.username);
  }
  //date from
onChangeFrom = (d) => {
  this.setState({ dateFrom:d },()=>{
    var MYdate = new Date(this.state.dateFrom);
    var MYDateString;
    MYDateString = MYdate.getFullYear() + '-' 
    + ('0' + (MYdate.getMonth()+1)).slice(-2) + '-'
    +  ('0' + MYdate.getDate()).slice(-2);
                 console.log("mdds",MYDateString);
                 this.setState({dateF: MYDateString});            
      });
    }
//Date To
onChangeTo = (date) => {
  this.setState({ dateTo:date},()=>{
    var MyDate = new Date(this.state.dateTo);
var MyDateString;
MyDateString = MyDate.getFullYear() + '-' 
+ ('0' + (MyDate.getMonth()+1)).slice(-2) + '-'
+  ('0' + MyDate.getDate()).slice(-2);
             this.setState({dateT:MyDateString});
  });}

  
render(){

const {username, dateFrom, dateTo, commitdata}= this.state;
const ref = React.createRef();

  return (
    <div>
      
      
      <h2>Search Contributor Data</h2>
      <TextField   
              variant="outlined"
              label="Username"
              value={username}
              onChange={this.userChange} 
            />
           

            <b>From</b>
            <DatePicker
            dateFormat="yyyy-MM-dd"
        selected={dateFrom}
        onChange={this.onChangeFrom}
      />
            <b>To</b>
            <DatePicker
            dateFormat="yyyy-MM-dd"
        selected={dateTo}
        onChange={this.onChangeTo}
      />
      {/* Fetch data from API */}
    
        <Button variant="contained"
            color="primary" onClick={this.fetchData}>
          Fetch Data
        </Button>
        <br />
      
        <Pdf targetRef={ref} filename="git-contributorData.pdf" >
        {({toPdf}) => (
            <Button variant="contained"
            color="primary"
             onClick={toPdf}>
               Generate pdf
               </Button>
        )}</Pdf>
      <Paper  ref={ref}>

      <TableContainer style={{background:"#ffda99"}} >
      <Table  size="small" aria-label="a dense table">
          <TableHead>

            <TableRow>

              <TableCell><b>Commit Date</b></TableCell><TableCell><b>Commit Comment</b></TableCell><TableCell><b>Repo Name</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
        {
          commitdata.map((item, index)=> { 
           

            return ( 
              <TableRow key={index}>
                <TableCell>{item.date}</TableCell>
                <TableCell>{item.message}</TableCell>
                <TableCell>{item.reponame}</TableCell>
              </TableRow>
              
            );
          })}
  </TableBody>
          </Table>
          </TableContainer>
          </Paper>
      </div>
      
      
    
  );
}
}

export default App;