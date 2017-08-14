import React from 'react';
import ReactDOM from 'react-dom';
import autobind from 'autobind-decorator';

// CSS
import '../css/fontello.css';
import '../css/styles.css';

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

class Card extends React.Component {
  render() {
    const { bordered = true, children, title, className } = this.props;
    let wrapperClassName = `card ${className}`;
    if (bordered) {
      wrapperClassName += ' bordered';
    }

    return (
      <div className={wrapperClassName}>
        {title && <div className="card-title">{title}</div>}
        <div className="card-content">{children}</div>
      </div>
    );
  }
}

class DivButton extends React.Component {
  render() {
    const { children, type = 'normal', ...props } = this.props;
    return (
      <div className={`button ${type}`} {...props}>
        {children}
      </div>
    )
  }
}

class LinkButton extends React.Component {
  render() {
    const { children, type = 'normal', ...props } = this.props;
    return (
      <a className={`button ${type}`} {...props}>
        {children}
      </a>
    )
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

  getWidth(puzzle) {
    const offset = 0x92b0 + (puzzle * 0x20) + 0x1E;
    return this.dataView.getUint8(offset);
  }

  getHeight(puzzle) {
    const offset = 0x92b0 + (puzzle * 0x20) + 0x1F;
    return this.dataView.getUint8(offset);
  }

  setWidth(puzzle, width) {
    const offset = 0x92b0 + (puzzle * 0x20) + 0x1E;
    return this.dataView.setUint8(offset, width);
  }

  setHeight(puzzle, height) {
    const offset = 0x92b0 + (puzzle * 0x20) + 0x1F;
    return this.dataView.setUint8(offset, height);
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
      <div className="layout">
        <header className="header">
          <h1 className="site-title">Picross Editor</h1>
        </header>
        <section className="content">
          <div className="sidebar">
            <FileManager rom={rom} onChange={this.handleChangeRom} />
            {rom && <PuzzleSelector puzzle={puzzle} onChange={this.handleChangePuzzle} />}
          </div>
          <div className="map-editor">
            {rom && <PuzzleEditor rom={rom} puzzle={puzzle} disabled={puzzle === 0}/>}
          </div>
        </section>
      </div>
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
            <LinkButton type="primary" href={rom.createObjectURL()} download={rom.name}>
              <Icon type="floppy" /> Save File
            </LinkButton>
          </div>
        }
        <Upload onChange={this.handleUpload}>
          <DivButton>
            <Icon type="folder-open-empty" /> Open a New Rom
          </DivButton>
        </Upload>
      </Card>
    )
  }
}

@autobind
class Upload extends React.Component {
  handleChange(event) {
    const { onChange } = this.props;
    onChange(event.target.files[0]);
  }

  render() {
    const { children } = this.props;
    return (
      <label className="upload upload-label">
        <input type="file" className="upload-input" onChange={this.handleChange} />
        {children}
      </label>
    );
  }
}

@autobind
class PuzzleSelector extends React.Component {
  onChange(event) {
    let puzzle = Number.parseInt(event.target.value);
    this.props.onChange(puzzle);
  }

  render() {
    const { puzzle } = this.props;
    return (
      <Card title="Puzzle Selector" className="puzzle-selector">
        <select
          value={ `${puzzle}`}
          onChange={this.onChange}
        >
          <option value="0">Demo</option>
          <optgroup label="Easy Picross">
            {LEVEL_NAMES.map((name, index)=> (
              <option key={index} value={`${index + 1}`}>
                Easy Picross: {name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Picross">
            {LEVEL_NAMES.map((name, index)=> (
              <option key={index} value={`${index + 65}`}>
                Picross: {name}
              </option>
            ))}
          </optgroup>
        </select>
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

  handleChangeSize(event) {
    const { puzzle, rom } = this.props;
    const size = Number.parseInt(event.target.value);
    rom.setWidth(puzzle, size);
    rom.setHeight(puzzle, size);
    this.forceUpdate();
  }

  render() {
    const { tool } = this.state;
    const { disabled, puzzle, rom } = this.props;
    const width = rom.getWidth(puzzle);
    let className = 'puzzle-editor';
    if (disabled) {
      className += ' disabled';
    }

    return (
      <Card title="Puzzle Editor" className={className}>
        <div className="grid-container">
          <div className="editor-sidebar">
            <Card title="Preview" bordered={false} className="preview-grid">
              <PuzzleGrid puzzle={puzzle} rom={rom} size="small" />
            </Card>
            {!disabled &&
              <Card title="Size" bordered={false} className="size-selector">
                <select value={`${width}`} onChange={this.handleChangeSize}>
                  <option value="5">5x5</option>
                  <option value="10">10x10</option>
                  <option value="15">15x15</option>
                </select>
              </Card>
            }
          </div>
          <div className="editor-grid">
            {disabled
              ? <Alert type="error" title="Editing Disabled">
                  <p>Editing this puzzle will break the game, so editing is disabled.</p>
                </Alert>
              : <ToolSelector tool={tool} onChange={this.handleChangeTool} />
            }
            <PuzzleGrid puzzle={puzzle} rom={rom} size="big" onEditCell={this.handleEditCell} editable />
          </div>
        </div>
      </Card>
    );
  }
}

class Alert extends React.Component {
  render() {
    const { type = 'normal', title, children } = this.props;
    return (
      <div className={`alert ${type}`}>
        {title && <div className="alert-title">{title}</div>}
        {children}
      </div>
    );
  }
}

@autobind
class ToolSelector extends React.Component {
  handleSelect(name) {
    this.props.onChange(name);
  }

  render() {
    return (
      <Menu
        className="tool-selector"
        selectedName={this.props.tool}
        onSelect={this.handleSelect}
      >
        <Menu.Item name="paint">
          <Icon type="pencil" /> Draw
        </Menu.Item>
        <Menu.Item name="erase">
          <Icon type="eraser" /> Erase
        </Menu.Item>
      </Menu>
    );
  }
}

@autobind
class Menu extends React.Component {
  static Item = class Item extends React.Component {
    render() {
      const { name, children, selectedName } = this.props;
      let className = 'menu-item';
      if (name === selectedName) {
        className += ' selected';
      }

      return (
        <li className={className} data-name={name}>{children}</li>
      );
    }
  }

  handleClick(event) {
    const { onSelect } = this.props;
    if (event.target.matches('.menu-item')) {
      onSelect(event.target.dataset.name);
    }
  }

  render() {
    const { children, selectedName } = this.props;
    return (
      <ul className="menu" onClick={this.handleClick}>
        {children.map(child => React.cloneElement(child, { selectedName }))}
      </ul>
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
    if (this.props.editable) {
      document.addEventListener('mouseup', this);
    }
  }

  componentWillUnmount() {
    if (this.props.editable) {
      document.removeEventListener('mouseup', this);
    }
  }

  handleEvent(event) {
    switch (event.type) {
      case 'mouseup':
        this.handleDocumentMouseUp();
        break
    }
  }

  handleMouseDownCell(row, col) {
    if (this.props.editable) {
      this.editing = true;
      this.props.onEditCell(row, col);
    }
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
    const { className = "", puzzle, rom, size } = this.props;
    const width = rom.getWidth(puzzle);
    const height = rom.getHeight(puzzle);
    let cellEventHandlers = {};
    if (this.props.editable) {
      cellEventHandlers = {
        onMouseDownCell: this.handleMouseDownCell,
        onMouseEnterCell: this.handleMouseEnterCell,
      };
    }

    return (
      <table className={`puzzle-grid ${size} ${className}`}>
        <tbody>
          {[].concat(range(height).map(row => (
            <tr key={row}>
              {range(width).map(col => (
                <Cell
                  key={col}
                  filled={rom.getFilled(puzzle, row, col)}
                  row={row}
                  col={col}
                  {...cellEventHandlers}
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
    if (this.props.onMouseEnterCell) {
      this.props.onMouseEnterCell(row, col);
    }
  }

  handleMouseDown() {
    const { row, col } = this.props;
    if (this.props.onMouseDownCell) {
      this.props.onMouseDownCell(row, col);
    }
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
