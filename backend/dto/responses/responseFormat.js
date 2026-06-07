// utils/responseFormat.js

const responseFormat = ({ code, status }, data = null, message = null) => {
  return {
    code,
    status,
    message,
    data,
  };
};

export default responseFormat;
