
import { FC, ReactElement } from "react";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactElement;
    title?: string;
    footer?: ReactElement; 
}

export default function Modal(props: ModalProps): ReturnType<FC> {
    return (
        <div className={`${"modal"} ${props.open ? "display-block" : "display-none"}`}>
            <div className="modal-main">
                <div className="modal-header">
                    <h2>{props.title || "Modal Title"}</h2>
                    <button className="qwm-close" aria-label="Close" onClick={props.onClose}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 20 20"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12.6666667,11.3333333 L20,11.3333333 L20,12.6666667 L12.6666667,12.6666667 L12.6666667,20 L11.3333333,20 L11.3333333,12.6666667 L4,12.6666667 L4,11.3333333 L11.3333333,11.3333333 L11.3333333,4 L12.6666667,4 L12.6666667,11.3333333 Z"
                                transform="rotate(45 13.414 8.586)"
                            />
                        </svg>
                    </button>
                </div>
                <hr className="modal-divider" />
                <div className="modal-body">
                    {props.children}
                </div>
                {props.footer && (
                    <div className="btn-container">
                        {props.footer}
                    </div>
                )}
            </div>
        </div>
    );
}


export const NewDiagramModal = ({ open, onClose, onConfirm }) => (
  <Modal title="New Diagram" open={open} onClose={onClose} footer={
    <div className="flex justify-end space-x-2">
      <button className="btn btn-primary" onClick={onConfirm}>Yes</button>
      <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
    </div>
  }>
    <p>Are you sure you want to create a new model? This will overwrite the current flow.</p>
  </Modal>
);