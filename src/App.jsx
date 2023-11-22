import { useRef, useEffect } from 'react';
import './App.css';
import Shape from './Shape.jsx';

Object.prototype.clone = function () {
    var newObj = this instanceof Array ? [] : {};
    for (let i in this) {
        if (i == 'clone') continue;
        if (this[i] && typeof this[i] == 'object') {
            newObj[i] = this[i].clone();
        } else newObj[i] = this[i];
    }
    return newObj;
};

function App() {
    const workElementRef = useRef(null);
    const resultsElementRef = useRef(null);
    const debugElementRef = useRef(null);
    const solutionCount = useRef(null);
    const startButtonRef = useRef(null)
    const stopButtonRef = useRef(null)

    var BoardConfig = ['XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX', 'XXXXXXXXXXX'];

    var Pentominoes = [
        {
            Name: 'L',
            Layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [1, 4],
                [2, 4],
            ],
        },
        {
            Name: 'l',
            Layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
            ],
        },
        {
            Name: 'i',
            Layout: [
                [1, 1],
                [1, 2],
                [2, 2],
            ],
        },
        {
            Name: 'N',
            Layout: [
                [2, 1],
                [2, 2],
                [1, 3],
                [2, 3],
                [1, 4],
            ],
        },
        {
            Name: 'V',
            Layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
                [3, 3],
            ],
        },
        {
            Name: 'P',
            Layout: [
                [1, 1],
                [2, 1],
                [1, 2],
                [2, 2],
                [1, 3],
            ],
        },
        {
            // Replace from S to F
            Name: 'S',
            Layout: [
                [2, 1],
                [1, 2],
                [2, 2],
                [2, 3],
                [3, 3],
            ],
        },
        {
            Name: 'U',
            Layout: [
                [1, 1],
                [3, 1],
                [1, 2],
                [2, 2],
                [3, 2],
            ],
        },
        {
            Name: 'W',
            Layout: [
                [1, 1],
                [1, 2],
                [2, 2],
                [2, 3],
                [3, 3],
            ],
        },
        {
            // Replace from X to New Shape(unknown)
            Name: 'X',
            Layout: [
                [2, 1],
                [3, 1],
                [1, 2],
                [2, 2],
            ],
        },
        {
            Name: 'Y',
            Layout: [
                [1, 1],
                [1, 2],
                [1, 3],
                [2, 3],
                [1, 4],
            ],
        },
        {
            // replaced from I to New Shape(Unknown)
            Name: 'I',
            Layout: [
                [2, 1],
                [1, 2],
                [2, 2],
                [3, 2],
            ],
        },
    ];

    var Shapes = [];

    var Board = {};

    var WebWorker = null;
    var Solutions = 0;
    var SolHash = {};

	
    // useEffect(() => {
    //     return StartWorker();
    // }, []);

    function StartWorker() {
        Initialise();

        if (typeof Worker !== 'undefined') {
            WebWorker = new Worker('poly.js');

            WebWorker.addEventListener('message', MessageCb, false);

            WebWorker.postMessage({ MsgType: 'start', Shapes: JSON.stringify(Shapes), Board: JSON.stringify(Board) });
            startButtonRef.current.display = 'none'
        } else {
            WorkerStopped();
            alert('This browser does not support Web Workers! Try Chrome, Firefox, Opera or Safari');
        }
    }

    function StopWorker() {
        WebWorker.terminate();
        WorkerStopped();
    }

    function WorkerStopped() {
        WebWorker = null;
        // $("#stopbtn").remove();
        startButtonRef.current.display = 'block'
        stopButtonRef.current.display = 'none'
    }

    function MessageCb(Event) {
        var Data = Event.data;
        var Board;

        switch (Data.MsgType) {
            case 'debug':
                Debug(Data.Msg);
                break;

            case 'solution':
                Board = JSON.parse(Data.Board);
                if (!DuplicateSolution(Board, Shapes)) {
                    DumpBoard(Board, Shapes);
                }
                break;

            case 'workupdate':
                Board = JSON.parse(Data.Board);
                UpdateWorkBoard(Board);
                break;

            case 'finished':
                StopWorker();
                break;
        }
    }

    function DuplicateSolution(Board, Shapes) {
        var Dupe = false;
        var String = '';
        var CurShape;
        var Row;
        var Col;

        for (Row = 0; Row < Board.Height; Row++) {
            for (Col = 0; Col < Board.Width; Col++) {
                CurShape = Board.Layout[Col][Row];
                if (CurShape >= 0) String += Shapes[CurShape].Name;
            }
        }

        if (SolHash[String] === undefined) {
            SolHash[String] = null;
        } else {
            Dupe = true;
        }

        return Dupe;
    }

    function Initialise() {
        var CurShape;
        var i, j, k;

        //    Debug("Using " + Pentominoes.length + " pentominoes");
        for (i = 0; i < Pentominoes.length; i++) {
            Shapes[i] = {};
            Shapes[i].Layout = [];
            Shapes[i].Name = Pentominoes[i].Name;
            Shapes[i].Colour = Pentominoes[i].Colour;
            for (k = 0; k < 3; k++) {
                CurShape = Pentominoes[i].Layout;
                switch (k) {
                    case 0:
                        CurShape = ShiftShape(CurShape);
                        CurShape.sort(LocCompare);
                        break;
                    case 1:
                        CurShape = FlipShapeX(CurShape);
                        break;
                    case 2:
                        CurShape = FlipShapeY(CurShape);
                        break;
                }
                for (j = 0; j < 4; j++) {
                    if (!DuplicateLayout(Shapes[i].Layout, CurShape)) {
                        AddLayout(i, CurShape);
                    }
                    CurShape = RotateShape(CurShape);
                }
            }
            /*
          Debug("Pentomino " + Pentominoes[i].Name + " has " + Shapes[i].Layout.length + " layouts");
          for(var l=0; l<Shapes[i].Layout.length; l++){
              Debug(Shapes[i].Layout[l].toString())
          }
  */
        }

        Board.Width = 0;
        Board.Height = BoardConfig.length;
        for (i = 0; i < BoardConfig.length; i++) {
            Board.Width = Math.max(Board.Width, BoardConfig[i].length);
        }

        Board.Layout = [];
        for (i = 0; i < Board.Width; i++) {
            var Col = new Array();
            for (j = 0; j < Board.Height; j++) {
                if (BoardConfig[j].substring(i, i + 1) == 'X') Col.push(-1);
                else Col.push(-2);
            }
            Board.Layout.push(Col);
        }

        DrawWorkBoard(Board);
    }

    function AddLayout(ShapeNo, Layout) {
        Shapes[ShapeNo].Layout.push(Layout);
    }

    function DuplicateLayout(Layouts, Shape) {
        for (var i = 0; i < Layouts.length; i++) {
            if (CompareShape(Layouts[i], Shape)) return true;
        }

        return false;
    }

    function CompareShape(Shape1, Shape2) {
        if (Shape1.length != Shape2.length) return false;

        for (var i = 0; i < Shape1.length; i++) {
            if (Shape1[i][0] != Shape2[i][0]) return false;
            if (Shape1[i][1] != Shape2[i][1]) return false;
        }

        return true;
    }

    function ShiftShape(Shape) {
        var NewShape = Shape.clone();
        var MinX = NewShape[0][0];
        var MinY = NewShape[0][1];
        var i;

        for (i = 0; i < NewShape.length; i++) {
            MinX = Math.min(MinX, NewShape[i][0]);
            MinY = Math.min(MinY, NewShape[i][1]);
        }

        for (i = 0; i < NewShape.length; i++) {
            NewShape[i][0] -= MinX;
            NewShape[i][1] -= MinY;
        }

        return NewShape;
    }

    function RotateShape(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            var x = NewShape[i][0];
            var y = NewShape[i][1];
            NewShape[i][0] = 6 - y;
            NewShape[i][1] = x;
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function FlipShapeX(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            NewShape[i][0] = 6 - NewShape[i][0];
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function FlipShapeY(Shape) {
        var NewShape = Shape.clone();

        for (var i = 0; i < NewShape.length; i++) {
            NewShape[i][1] = 6 - NewShape[i][1];
        }
        NewShape.sort(LocCompare);

        return ShiftShape(NewShape);
    }

    function LocCompare(Loc1, Loc2) {
        if (Loc1[0] < Loc2[0]) return -1;
        if (Loc1[0] > Loc2[0]) return 1;
        if (Loc1[1] < Loc2[1]) return -1;
        if (Loc1[1] > Loc2[1]) return 1;
        return 0;
    }

    function DumpBoard(Board, Shapes) {
        var Row;
        var Col;
        var Table;

        Table = document.createElement('table');
        Table.setAttribute('class', 'st');
        let TableBody = document.createElement('tbody');
        Table.appendChild(TableBody);
        for (Row = 0; Row < Board.Height; Row++) {
            let TableRow = document.createElement('tr');
            TableRow.setAttribute('class', 'sr');
            TableBody.appendChild(TableRow);

            for (Col = 0; Col < Board.Width; Col++) {
                let TableData = document.createElement('td');
                TableData.setAttribute('class', `sc ${CellClass(Board, Col, Row)} `);

                TableRow.appendChild(TableData);
            }
        }

        resultsElementRef.current.appendChild(Table);

        solutionCount.current.innerText = ++Solutions;
    }

    function DrawWorkBoard(Board) {
        var Row;
        var Col;
        var Table;

        Table = document.createElement('table');
        Table.setAttribute('id', 'worktable');
        Table.setAttribute('class', 'wt');
        let TableBody = document.createElement('tbody');
        Table.appendChild(TableBody);
        for (Row = 0; Row < Board.Height; Row++) {
            let TableRow = document.createElement('tr');
            TableRow.setAttribute('class', 'sr');
            TableBody.appendChild(TableRow);
            for (Col = 0; Col < Board.Width; Col++) {
                let TableData = document.createElement('td');
                TableData.setAttribute('id', `workcell${Col}x${Row}`);
                TableData.setAttribute('class', 'wc');

                TableRow.appendChild(TableData);
            }
        }
        workElementRef.current.replaceChildren(Table);
    }

    function UpdateWorkBoard(Board) {
        var Row;
        var Col;
        var Class;

        for (Row = 0; Row < Board.Height; Row++) {
            for (Col = 0; Col < Board.Width; Col++) {
                Class = CellClass(Board, Col, Row);
                let element = document.getElementById(`workcell${Col}x${Row}`);
                element.setAttribute('class', `wc${Class}`);
            }
        }
    }

    function CellClass(Board, Col, Row) {
        var CurShape;
        var Class;

        CurShape = Board.Layout[Col][Row];

        if (CurShape == -2 && (Row == 0 || Board.Layout[Col][Row - 1] == -2)) Class = ' btn';
        else if (Row > 0 && Board.Layout[Col][Row - 1] == CurShape) Class = ' btd';
        else Class = ' bts';

        if (CurShape == -2 && (Row == Board.Height - 1 || Board.Layout[Col][Row + 1] == -2)) Class += ' bbn';
        else if (Row < Board.Height - 1 && Board.Layout[Col][Row + 1] == CurShape) Class += ' bbd';
        else Class += ' bbs';

        if (CurShape == -2 && (Col == 0 || Board.Layout[Col - 1][Row] == -2)) Class += ' bln';
        else if (Col > 0 && Board.Layout[Col - 1][Row] == CurShape) Class += ' bld';
        else Class += ' bls';

        if (CurShape == -2 && (Col == Board.Width - 1 || Board.Layout[Col + 1][Row] == -2)) Class += ' brn';
        else if (Col < Board.Width - 1 && Board.Layout[Col + 1][Row] == CurShape) Class += ' brd';
        else Class += ' brs';

        if (CurShape >= 0) Class += ' c' + Shapes[CurShape].Name;

        return Class;
    }

    function Debug(Msg) {
        debugElementRef.current.innerText = Msg;
    }

    return (
        <div className='space-y-6 my-6'>
            <h4 className='text-xl text-center font-medium leading-6 text-gray-800'>Shapes Used</h4>
            <Shape />
            <div className='my-12'>
                <hr />
            </div>
            <div className='flex flex-col items-center justify-center space-y-3'>
                <div className='space-y-5 text-center'>
                    <p className=' font-normal text-base text-gray-700'>
                        Solutions found:{' '}
                        <span className='font-medium text-xl text-gray-900' id="solcnt" ref={solutionCount}>
                            0
                        </span>
                    </p>
                   
                   <div className='flex items-center gap-4'>
                        <button className='px-3 py-1 rounded-md text-sm font-normal bg-green-200' ref={startButtonRef} id="stopbtn" onClick={() => StartWorker()}>
                            Start
                        </button>
                        <button className='px-3 py-1 rounded-md text-sm font-normal bg-red-200' ref={stopButtonRef} id="stopbtn" onClick={() => StopWorker()}>
                            Stop
                        </button>
                    </div>
                </div>

                <div id="work" ref={workElementRef}></div>


                <div className='flex justify-center flex-wrap gap-x-3 gap-y-6 py-5' id="results" ref={resultsElementRef}></div>
                <div id="debug" ref={debugElementRef}></div>
            </div>
        </div>
    );
}

export default App;
