import React from 'react';

import "../css/ListGroup.css";

const ListGroup = props => {
  return (
    <React.Fragment>
      <ul className="list-group">
      <h3>{props.name}</h3>
        {props.items.map(item => (
          <li key={item}
            className={item === props.selectedItem ? "list-group-item active" : "list-group-item"}
            onClick={() => props.onItemSelect(item)}
          >
            {item}
          </li>
        ))}
      </ul>
    </React.Fragment>
  );
}

export default ListGroup;
