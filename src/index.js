import _ from 'lodash';
import './style.css';
import 'bootstrap';

const component = () => {
  const element = document.createElement('form');
  const input = document.createElement('input');
  const submit = document.createElement('button');
  submit.textContent = 'Add';
  submit.classList.add('btn');
  element.append(input);
  element.append(submit);

  return element;
};

document.body.appendChild(component());
