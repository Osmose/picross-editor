import {
  Alert,
  Button,
  Card,
  Layout,
  LocaleProvider,
  Menu,
  Modal,
  TreeSelect,
  Upload,
} from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';

// CSS
import 'antd/dist/antd.css';

const TreeNode = TreeSelect.TreeNode;

const LEVEL_NAMES = [];
for (const num of '12345678') {
  for (const letter of 'ABCDEFGH') {
    LEVEL_NAMES.push(`${num}-${letter}`);
  }
}

class Icon extends React.Component {
  render() {
    return (
      <i className={`icon-${this.props.type}`} />
    );
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
        this.arrayBuffer = reader.result;
        this.dataView = new DataView(reader.result);
        resolve();
      };
      reader.readAsArrayBuffer(this.file);
    });
  }

  get name() {
    return this.file.name;
  }

  createObjectURL() {
    return URL.createObjectURL(new Blob([this.arrayBuffer]));
  }

  getFilled(puzzle, row, col) {
    const offset = 0x92b0 + (puzzle * 0x20) + (row * 2) + (col > 7 ? 1 : 0);
    const mask = 0b10000000 >> (col % 8);
    const byte = this.dataView.getUint8(offset);
    return (byte & mask) != 0;
  }

  setFilled(puzzle, row, col, filled) {
    const offset = 0x92b0 + (puzzle * 0x20) + (row * 2) + (col > 7 ? 1 : 0);
    const mask = 0b10000000 >> (col % 8);
    let byte = this.dataView.getUint8(offset);
    if (filled) {
      byte = byte | mask;
    } else {
      byte = byte & ~mask;
    }
    this.dataView.setUint8(offset, byte);
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
    this.setState({ rom, puzzle: 1 });
  }

  handleChangePuzzle(puzzle) {
    this.setState({ puzzle });
  }

  render() {
    const { rom, puzzle } = this.state;

    return (
      <LocaleProvider locale={enUS}>
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
              {rom && <PuzzleEditor rom={rom} puzzle={puzzle} disabled={puzzle === 0}/>}
            </div>
          </Layout.Content>
        </Layout>
      </LocaleProvider>
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

  handleClickSave() {
    const { rom } = this.props;
    Modal.info({
      title: "Download ROM",
      content: (
        <p>
          <a href={rom.createObjectURL()} download={rom.name}>
            Click here to download the saved ROM
          </a>
        </p>
      ),
      iconType: null,
    });
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
            <Button type="primary" onClick={this.handleClickSave}>
              <Icon type="floppy" /> Save File
            </Button>
          </div>
        }
        <Upload beforeUpload={this.handleUpload} className="upload" showUploadList={false}>
          <Button>
            <Icon type="folder-open-empty" /> Open a New Rom
          </Button>
        </Upload>
      </Card>
    )
  }
}

@autobind
class PuzzleSelector extends React.Component {
  onChange(value) {
    let puzzle = Number.parseInt(value);

    // Parent list items should select the first puzzle underneath.
    if (puzzle === -1) {
      puzzle = 1;
    } else if (puzzle === -2) {
      puzzle = 65;
    }

    if (puzzle >= 0) {
      this.props.onChange(puzzle);
    }
  }

  render() {
    const { puzzle } = this.props;
    return (
      <Card title="Puzzle Selector" className="puzzle-selector">
        <TreeSelect
          value={ `${puzzle}`}
          onChange={this.onChange}
          treeDefaultExpandAll
          dropdownStyle={{
            'max-height': '500px',
          }}
        >
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

@autobind
class PuzzleEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tool: 'paint',
    };
  }

  handleChangeTool(tool) {
    this.setState({ tool });
  }

  handleEditCell(row, col) {
    const { tool } = this.state;
    const { disabled, puzzle, rom } = this.props;
    if (!disabled) {
      const filled = tool === 'paint';
      rom.setFilled(puzzle, row, col, filled);
      this.forceUpdate();
    }
  }

  render() {
    const { tool } = this.state;
    const { disabled, puzzle, rom } = this.props;
    let className = 'puzzle-editor';
    if (disabled) {
      className += ' disabled';
    }

    return (
      <Card title="Puzzle Editor" className={className}>
        {disabled
          ? <Alert
              message="Editing Disabled"
              description="Editing this puzzle will break the game, so editing is disabled."
              type="error"
            />
          : <ToolSelector tool={tool} onChange={this.handleChangeTool} />
        }
        <PuzzleGrid puzzle={puzzle} rom={rom} onEditCell={this.handleEditCell} />
      </Card>
    );
  }
}

@autobind
class ToolSelector extends React.Component {
  handleSelect({ key }) {
    this.props.onChange(key);
  }

  render() {
    return (
      <Menu
        className="tool-selector"
        selectedKeys={[this.props.tool]}
        onSelect={this.handleSelect}
        mode="horizontal"
      >
        <Menu.Item key="paint">
          <Icon type="pencil" /> Draw
        </Menu.Item>
        <Menu.Item key="erase">
          <Icon type="eraser" /> Erase
        </Menu.Item>
      </Menu>
    );
  }
}

@autobind
class PuzzleGrid extends React.Component {
  constructor(props) {
    super(props);
    this.editing = false;
  }

  componentWillMount() {
    document.addEventListener('mouseup', this);
  }

  componentWillUnmount() {
    document.removeEventListener('mouseup', this);
  }

  handleEvent(event) {
    switch (event.type) {
      case 'mouseup':
        this.handleDocumentMouseUp();
        break
    }
  }

  handleMouseDownCell(row, col) {
    this.editing = true;
    this.props.onEditCell(row, col);
  }

  handleDocumentMouseUp() {
    this.editing = false;
  }

  handleMouseEnterCell(row, col) {
    if (this.editing) {
      this.props.onEditCell(row, col);
    }
  }

  render() {
    const { puzzle, rom } = this.props;
    const size = rom.getDimension(puzzle);
    return (
      <table className="puzzle-grid">
        <tbody>
          {[].concat(range(size).map(row => (
            <tr key={row}>
              {range(size).map(col => (
                <Cell
                  key={col}
                  filled={rom.getFilled(puzzle, row, col)}
                  row={row}
                  col={col}
                  onMouseDownCell={this.handleMouseDownCell}
                  onMouseEnterCell={this.handleMouseEnterCell}
                />
              ))}
            </tr>
          )))}
        </tbody>
      </table>
    );
  }
}

@autobind
class Cell extends React.Component {
  handleMouseEnter() {
    const { row, col } = this.props;
    this.props.onMouseEnterCell(row, col);
  }

  handleMouseDown() {
    const { row, col } = this.props;
    this.props.onMouseDownCell(row, col);
  }

  render() {
    const { filled } = this.props;
    let className = '';
    if (filled) {
      className = "filled";
    }
    return (
      <td
        className={className}
        onMouseEnter={this.handleMouseEnter}
        onMouseDown={this.handleMouseDown}
      />
    );
  }
}

ReactDOM.render(
  <App />,
  document.getElementById('app')
);
