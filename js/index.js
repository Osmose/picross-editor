import { Button, Card, Icon, Layout, TreeSelect, Upload } from 'antd';
import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';

// Ant CSS
import 'antd/dist/antd.css';

const TreeNode = TreeSelect.TreeNode;

const LEVEL_NAMES = [];
for (const num of '12345678') {
  for (const letter of 'ABCDEFGH') {
    LEVEL_NAMES.push(`${num}-${letter}`);
  }
}

class PicrossRom {
  constructor(file) {
    this.file = file;
  }

  async loadFile() {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => {
        this.dataView = new DataView(reader.result);
        resolve();
      };
      reader.readAsArrayBuffer(this.file);
    });
  }

  get name() {
    return this.file.name;
  }

  getFilled(puzzle, row, col) {
    const offset = 0x92b0 + (puzzle * 0x20) + (row * 2) + (col > 7 ? 1 : 0);
    const byte = this.dataView.getUint8(offset);
    return (byte & (0b10000000 >> (col % 8))) != 0;
  }

  getDimension(puzzle) {
    const offset = 0x92b0 + (puzzle * 0x20) + 0x1E;
    return this.dataView.getUint8(offset);
  }
}

@autobind
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      rom: null,
      puzzle: null,
    };
  }

  handleChangeRom(rom) {
    this.setState({ rom, puzzle: 0 });
  }

  handleChangePuzzle(puzzle) {
    this.setState({ puzzle });
  }

  render() {
    const { rom, puzzle } = this.state;

    return (
      <Layout className="layout">
        <Layout.Header>
          <h1 className="site-title">Picross Editor</h1>
        </Layout.Header>
        <Layout.Content className="content">
          <div className="sidebar">
            <FileManager rom={rom} onChange={this.handleChangeRom} />
            {rom && <PuzzleSelector puzzle={puzzle} onChange={this.handleChangePuzzle} />}
          </div>
          <div className="map-editor">
            {rom && <PuzzleEditor rom={rom} puzzle={puzzle} />}
          </div>
        </Layout.Content>
      </Layout>
    );
  }
}

@autobind
class FileManager extends React.Component {
  async handleUpload(file) {
    const rom = new PicrossRom(file);
    await rom.loadFile();
    this.props.onChange(rom);
    return false;
  }

  render() {
    const { rom } = this.props;
    return (
      <Card title="File" className="file-manager">
        {rom &&
          <div>
            <div className="current-file">
              <span className="label">Current File:</span>
              {rom.name}
            </div>
            <Button type="primary">
              <Icon type="save" /> Save File
            </Button>
          </div>
        }
        <Upload beforeUpload={this.handleUpload} className="upload" showUploadList={false}>
          <Button>
            <Icon type="upload" /> Open a New Rom
          </Button>
        </Upload>
      </Card>
    )
  }
}

@autobind
class PuzzleSelector extends React.Component {
  onChange(value) {
    const puzzle = Number.parseInt(value);
    if (puzzle >= 0) {
      this.props.onChange(puzzle);
    }
  }

  render() {
    const { puzzle } = this.props;
    return (
      <Card title="Puzzle Selector" className="puzzle-selector">
        <TreeSelect value={ `${puzzle}`} onChange={this.onChange}>
          <TreeNode value="0" key="0" title="Demo" isLeaf />
          <TreeNode value="-1" key="-1" title="Easy Picross">
            {LEVEL_NAMES.map((name, index)=> (
              <TreeNode
                value={`${index + 1}`}
                key={`${index + 1}`}
                title={`Easy Picross: ${name}`}
                isLeaf
              />
            ))}
          </TreeNode>
          <TreeNode value="-2" key="-2" title="Picross">
            {LEVEL_NAMES.map((name, index)=> (
              <TreeNode
                value={`${index + 65}`}
                key={`${index + 65}`}
                title={`Picross: ${name}`}
                isLeaf
                />
            ))}
          </TreeNode>
        </TreeSelect>
      </Card>
    );
  }
}

function range(num) {
  const list = [];
  for (var k = 0; k < num; k++) {
    list.push(k);
  }
  return list;
}

class PuzzleEditor extends React.Component {
  render() {
    const { puzzle, rom } = this.props;
    const size = rom.getDimension(puzzle);
    return (
      <Card title="Puzzle Editor">
        <table className="puzzle-grid">
          <tbody>
            {[].concat(range(size).map(row => (
              <tr key={row}>
                {range(size).map(col => (
                  <Cell key={col} filled={rom.getFilled(puzzle, row, col)} />
                ))}
              </tr>
            )))}
          </tbody>
        </table>
      </Card>
    );
  }
}

class Cell extends React.Component {
  render() {
    const { filled } = this.props;
    let className = '';
    if (filled) {
      className = "filled";
    }
    return (
      <td className={className} />
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
