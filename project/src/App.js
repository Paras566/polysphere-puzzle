import React from 'react';
import './App.css';

class App extends React.Component {
  componentDidMount() {
    // Tweakables

    let i,OffX,OffY,Fit,PtX,PtY;
var ShowWork = true;
var FPSTarget = 30;

// End of tweakables

var LastUpdateTime = 0;

Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

addEventListener('message', MsgHandler);

function MsgHandler(Event)
{
    var Data = Event.data;
    
    switch(Data.MsgType){
        case "start":
            StartFit(JSON.parse(Data.Shapes), JSON.parse(Data.Board));
            break;
        default:
            Debug("Unrecognised command " + Data.MsgType);
            break;
    }
}

function StartFit(Shapes, Board)
{    
    var ShapeList = [];
    for(i=0; i<Shapes.length; i++){
        ShapeList.push(i);
    }

    FitShapes(Shapes, Board, 0, 0, ShapeList);

    postMessage({'MsgType': "finished"});
}

function FitShapes(Shapes, Board, BoardX, BoardY, ShapeList)
{
    var BoardLayout = Board.Layout;
    var Pt;
    var DateNow;
    var TimeNow;
    
    // Find free square
    do{
        if(BoardLayout[BoardX][BoardY] == -1){
            // Fit shape here
            break;
        }
        else{
            if(++BoardX >= Board.Width){
                BoardX=0;
                if(++BoardY >= Board.Height){
                    Debug("OUT OF SPACES!?");
                    return;
                }
            }
        }
    } while(1);
    
    for(var ListItem=0; ListItem<ShapeList.length; ListItem++){
        var ShapeNo = ShapeList[ListItem];
        var Shape = Shapes[ShapeNo];
        var Layouts = Shape.Layout;
        for(var LayoutNo=0; LayoutNo<Layouts.length; LayoutNo++){
            var Layout = Layouts[LayoutNo];
            for(var PtNo=0; PtNo<Layout.length; PtNo++){
                OffX = BoardX - Layout[PtNo][0];
                OffY = BoardY - Layout[PtNo][1];
                Fit = true;
                for(Pt=0; Pt<Layout.length; Pt++){
                    PtX = OffX + Layout[Pt][0];
                    PtY = OffY + Layout[Pt][1];
                    if(PtX<0 || PtX>=Board.Width || PtY<0 || PtY>=Board.Height){
                        Fit = false;
                        break;
                    }
                    if(BoardLayout[PtX][PtY] != -1){
                        Fit = false;
                        break;
                    }
                }
                if(Fit){
                    // The shape fits here
                    var NewBoard = Board.clone();
                    // Update the board
                    for(Pt=0; Pt<Layout.length; Pt++){
                        PtX = OffX + Layout[Pt][0];
                        PtY = OffY + Layout[Pt][1];
                        NewBoard.Layout[PtX][PtY] = ShapeNo;
                    }      
                    // Update the shape list
                    var NewShapeList = ShapeList.clone();
                    NewShapeList.remove(ListItem);
//                    Debug("Fit shape " + Shape.Name + "(" + ShapeNo + ") layout " + LayoutNo + " point " + PtNo + " at " + BoardX + ","+BoardY);
                    if(NewShapeList.length == 0){
                        // Got a solution!
                        postMessage({'MsgType': "solution", 'Board': JSON.stringify(NewBoard)});
                    }
                    else{
                        // Recurse
                        if(ShowWork){
                            DateNow = new Date();
                            TimeNow = DateNow.getTime();
                            if((TimeNow - LastUpdateTime) > (1000 / FPSTarget)){
                                postMessage({'MsgType': "workupdate", 'Board': JSON.stringify(NewBoard)});
                                LastUpdateTime = TimeNow;
                            }
                        }
                        FitShapes(Shapes, NewBoard, BoardX, BoardY, NewShapeList);
                    }
                }
            }
        }
    }
}


function Debug(Msg)
{
    postMessage({'MsgType': "debug", 'Msg': Msg});
}
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
