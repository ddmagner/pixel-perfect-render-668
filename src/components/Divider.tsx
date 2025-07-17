import React from 'react';

export const Divider: React.FC = () => {
  return (
    <div className="w-full h-px">
      <div
        dangerouslySetInnerHTML={{
          __html:
            "<svg width=\"440\" height=\"1\" viewBox=\"0 0 440 1\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"divider-line\" style=\"display: flex; height: 0.5px; padding: 0px 20px; flex-direction: column; align-items: flex-start; gap: 10px; flex-shrink: 0; align-self: stretch\"> <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M420 0.500035L20 0.5L20 0L420 3.49691e-05L420 0.500035Z\" fill=\"#09121F\"></path> </svg>",
        }}
      />
    </div>
  );
};
