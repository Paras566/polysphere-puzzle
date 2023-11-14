import React from 'react';
import './App.css';


Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (let i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};
class App extends React.Component {
  constructor(props) {
    super()
    this.BoardConfig = [
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
    "XXXXXXXXXXX",
  ]; 
  this.Pentominoes = [{
    Name: "L",
    Layout: [
    [1,1],
    [1,2],
    [1,3],
    [1,4],[2,4]
    ]},
{
    Name: "l",
    Layout: [
    [1,1],
    [1,2],
    [1,3],[2,3]
    ]},
{
    Name: "i",
    Layout: [
    [1,1],
    [1,2],[2,2]
    ]},
{
    Name: "N",
    Layout: [
          [2,1],
          [2,2],
    [1,3],[2,3],
    [1,4]
    ]},
{
    Name: "V",
    Layout: [
    [1,1],
    [1,2],
    [1,3],[2,3],[3,3]
    ]},
{
    Name: "P",
    Layout: [
    [1,1],[2,1],
    [1,2],[2,2],
    [1,3]
    ]},
{
    Name: "S",
    Layout: [
          [2,1],[3,1],
    [1,2],[2,2],
    ]},
{
    Name: "U",
    Layout: [
    [1,1],      [3,1],
    [1,2],[2,2],[3,2]
    ]},
{
    Name: "W",
    Layout: [
    [1,1],
    [1,2],[2,2],
          [2,3],[3,3]
    ]},
{
    Name: "X",
    Layout: [
          [2,1],
    [1,2],[2,2],
          [2,3],[3,3]
    ]},
{
    Name: "Y",
    Layout: [
    [1,1],
    [1,2],
    [1,3],[2,3],
    [1,4]
    ]},
{
    Name: "I",
    Layout: [
    [1,1],
    [1,2],[2,2],
    [1,3]
    ]},
];
this.Shapes = [];
  
this.Board = {};

this.WebWorker = null;
this.Solutions = 0;
this.SolHash = {};

}

  // Object.prototype.clone = function() {
  //   var newObj = (this instanceof Array) ? [] : {};
  //   for (let i in this) {
  //     if (i == 'clone') continue;
  //     if (this[i] && typeof this[i] == "object") {
  //       newObj[i] = this[i].clone();
  //     } else newObj[i] = this[i]
  //   } return newObj;
  // };
  
  componentDidMount() { this.StartWorker() }
   StartWorker = () =>
  {
      this.Initialise();
      
      if(typeof(Worker)!=="undefined"){
          this.WebWorker = new Worker(new URL('./worker.js',import.meta.url));
      
          this.WebWorker.addEventListener('message', this.MessageCb, false);
      
          this.WebWorker.postMessage({'MsgType': "start", 'Shapes': JSON.stringify(this.Shapes), 'Board': JSON.stringify(this.Board)});
      }
      else{
          this.WorkerStopped();
          alert("This browser does not support Web Workers! Try Chrome, Firefox, Opera or Safari");
      }
  }
  
   StopWorker()
  {
      this.WebWorker.terminate();
      this.WorkerStopped();
  }
  
   WorkerStopped()
  {
      this.WebWorker = null;
      document.getElementById('stopbtn').remove();
  }
  
   MessageCb(Event)
  {
      var Data = Event.data;
      var Board;
      
      switch(Data.MsgType){
      case "debug":
          this.Debug(Data.Msg);
          break;
          
      case "solution":
          Board = JSON.parse(Data.Board);
          if(!this.DuplicateSolution(this.Board, this.Shapes)){
              this.DumpBoard(this.Board, this.Shapes);
          }
          break;
          
      case "workupdate":
          Board = JSON.parse(Data.Board);
          this.UpdateWorkBoard(this.Board);
          break;
  
      case "finished":
          this.StopWorker();
          break;
          
      }
  }
  
   DuplicateSolution(Board, Shapes)
  {
      var Dupe = false;
      var String = "";
      var CurShape;
      var Row;
      var Col;
      
      for(Row=0; Row<Board.Height; Row++){
          for(Col=0; Col<Board.Width; Col++){
              CurShape = Board.Layout[Col][Row];
              if(CurShape>=0) String += Shapes[CurShape].Name;
          }
      }
  
      if(this.SolHash[String] === undefined){
          this.SolHash[String] = null;
      }
      else{
          Dupe = true;
      }
  
      return Dupe;
  }
  
   Initialise()
  {
      var CurShape;
      var i,j,k;
      console.log(this.Shapes)
  //    Debug("Using " + this.Pentominoes.length + " this.Pentominoes");
      for(i=0; i<this.Pentominoes.length; i++){
          this.Shapes[i] = {}
          this.Shapes[i].Layout = [];
          this.Shapes[i].Name = this.Pentominoes[i].Name;
          this.Shapes[i].Colour = this.Pentominoes[i].Colour;
          for(k=0; k<3; k++){
              CurShape = this.Pentominoes[i].Layout;
              switch(k){
                  case 0:
                      CurShape = this.ShiftShape(CurShape);
                      CurShape.sort(this.LocCompare);
                      break;
                  case 1:
                      CurShape = this.FlipShapeX(CurShape);
                      break;
                  case 2:
                      CurShape = this.FlipShapeY(CurShape);
                      break;
              }
              for(j=0; j<4; j++){
                  if(!this.DuplicateLayout(this.Shapes[i].Layout, CurShape)){
                      this.AddLayout(i, CurShape);
                  }
                  CurShape = this.RotateShape(CurShape);
              }
          }
  /*
          Debug("Pentomino " + this.Pentominoes[i].Name + " has " + Shapes[i].Layout.length + " layouts");
          for(var l=0; l<Shapes[i].Layout.length; l++){
              Debug(Shapes[i].Layout[l].toString())
          }
  */
      }
      
      this.Board.Width = 0;
      this.Board.Height = this.BoardConfig.length;
      for(i=0; i<this.BoardConfig.length; i++){
          this.Board.Width = Math.max(this.Board.Width, this.BoardConfig[i].length);
      }
  
      this.Board.Layout = [];
      for(i=0; i<this.Board.Width; i++){
          var Col = new Array();
          for(j=0; j<this.Board.Height; j++){
              if(this.BoardConfig[j].substring(i,i+1) == "X") Col.push(-1);
              else Col.push(-2);
          }
          this.Board.Layout.push(Col);
      }
      
      this.DrawWorkBoard(this.Board);
  }
  
   AddLayout(ShapeNo, Layout)
  {
    this.Shapes[ShapeNo].Layout.push(Layout);
  }
  
   DuplicateLayout(Layouts, Shape)
  {
      for(var i=0; i<Layouts.length; i++){
          if(this.CompareShape(Layouts[i], Shape)) return true;
      }
      
      return false;
  }
  
   CompareShape(Shape1, Shape2)
  {
      if(Shape1.length != Shape2.length) return false;
      
      for(var i=0; i<Shape1.length; i++){
          if(Shape1[i][0] != Shape2[i][0]) return false;
          if(Shape1[i][1] != Shape2[i][1]) return false;
      }
      
      return true;
  }
  
   ShiftShape(Shape)
  {
      var NewShape = Shape.clone();
      var MinX = NewShape[0][0];
      var MinY = NewShape[0][1];
      var i;
      
      for(i=0; i<NewShape.length; i++){
          MinX = Math.min(MinX, NewShape[i][0]);
          MinY = Math.min(MinY, NewShape[i][1]);
      }
      
      for(i=0; i<NewShape.length; i++){
          NewShape[i][0] -= MinX;
          NewShape[i][1] -= MinY;
      }    
      
      return NewShape;
  }
  
   RotateShape(Shape)
  {
      var NewShape = Shape.clone();
      
      for(var i=0; i<NewShape.length; i++){
          var x = NewShape[i][0];
          var y = NewShape[i][1];
          NewShape[i][0] = 6-y;
          NewShape[i][1] = x;
      }
      NewShape.sort(this.LocCompare);
      
      return this.ShiftShape(NewShape);
  }
  
   FlipShapeX(Shape)
  {
      var NewShape = Shape.clone();
      
      for(var i=0; i<NewShape.length; i++){
          NewShape[i][0] = 6 - NewShape[i][0];
      }
      NewShape.sort(this.LocCompare);
      
      return this.ShiftShape(NewShape);    
  }
  
   FlipShapeY(Shape)
  {
      var NewShape = Shape.clone();
      
      for(var i=0; i<NewShape.length; i++){
          NewShape[i][1] = 6 - NewShape[i][1];
      }
      NewShape.sort(this.LocCompare);
  
      return this.ShiftShape(NewShape);        
  }
  
   LocCompare(Loc1, Loc2)
  {
      if(Loc1[0] < Loc2[0]) return -1;
      if(Loc1[0] > Loc2[0]) return 1;
      if(Loc1[1] < Loc2[1]) return -1;
      if(Loc1[1] > Loc2[1]) return 1;
      return 0;
  }
  
   DumpBoard(Board, Shapes)
  {
      var Row;
      var Col;
      var Table;
      
      Table = document.createElement('TABLE')
      Table.setAttribute('class', 'st')
      
      for(Row=0; Row<Board.Height; Row++){
        var TableRow = document.createElement('TR')
        TableRow.setAttribute('class', 'sr')
        Table.appendChild(TableRow)
          for(Col=0; Col<Board.Width; Col++){
            var TableData = document.createElement('TD')
            TableData.setAttribute('class', this.CellClass(Board, Col, Row))
            TableRow.appendChild(TableData)
          }
      }    

      document.getElementById('reslutls').append(Table);  
      
      document.getElementById('solcnt').innerHTML = ++this.Solutions;
  }
  
   DrawWorkBoard(Board)
  {
      var Row;
      var Col;
      var Table;
      Table = document.createElement('TABLE')
      Table.setAttribute('class', 'wt')
      Table.setAttribute('id', 'worktable')


      for(Row=0; Row<Board.Height; Row++){
        var TableRow = document.createElement('TR')
        TableRow.setAttribute('class', 'wr')
        Table.appendChild(TableRow)
          for(Col=0; Col<Board.Width; Col++){
            var TableData = document.createElement('TD')
            TableData.setAttribute('id', `workcell${Col}x${Row}`)
            TableData.setAttribute('class', 'wc')
            TableRow.appendChild(TableData)
          }
      }    
        
      document.getElementById('work').append(Table);  
 
  }
  
   UpdateWorkBoard(Board)
  {
      var Row;
      var Col;
      var Class;
      
      for(Row=0; Row<Board.Height; Row++){
          for(Col=0; Col<Board.Width; Col++){
              Class = this.CellClass(Board, Col, Row);
              document.getElementById(`workcell${Col}x${Row}`).setAttribute('class',`wc ${Class}`);  

          }
      }    
  }
  
   CellClass(Board, Col, Row)
  {
      var CurShape;
      var Class;
      
      CurShape = Board.Layout[Col][Row];
  
      if(CurShape == -2 && (Row == 0 || Board.Layout[Col][Row-1] == -2)) Class = " btn";
      else if(Row>0 && Board.Layout[Col][Row-1] == CurShape) Class = " btd";
      else Class = " bts";
  
      if(CurShape == -2 && (Row == Board.Height-1 || Board.Layout[Col][Row+1] == -2)) Class += " bbn";
      else if(Row<Board.Height-1 && Board.Layout[Col][Row+1] == CurShape) Class += " bbd";
      else Class += " bbs";
  
      if(CurShape == -2 && (Col == 0 || Board.Layout[Col-1][Row] == -2)) Class += " bln";
      else if(Col>0 && Board.Layout[Col-1][Row] == CurShape) Class += " bld";
      else Class += " bls";
  
      if(CurShape == -2 && (Col == Board.Width-1 || Board.Layout[Col+1][Row] == -2)) Class += " brn";
      else if(Col<Board.Width-1 && Board.Layout[Col+1][Row] == CurShape) Class += " brd";
      else Class += " brs";
  
      if(CurShape>=0) Class += " c" + this.Shapes[CurShape].Name;
  
      return Class;
  }
  
   Debug(Msg)
  {
      document.getElementById('debug').append('<p class="debug">' + Msg + "</p>");  
  }


  render() {
    return (
      <div>
        <button id="startbtn" onClick={this.StartWorker}>Start</button>
        <p>
          Solutions found: <span id="solcnt">0</span>
          <button id="stopbtn" onClick={this.StopWorker}>Stop</button>
        </p>
        <div id="work"></div>
        <div id="results"></div>
        <div id="debug"></div>
      </div>
    );
  }
}

export default App;
