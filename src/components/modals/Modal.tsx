import { FC, ReactElement } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: ReactElement;
    title?: string;
    footer?: ReactElement;
    className?: string;
}

export default function Modal(props: ModalProps) {
    if (!props.open) return null;

    return createPortal(
        <div className="modal fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className={`modal-main relative z-[10000] bg-white rounded-lg shadow-lg ${props.className || ""}`}>
                <div className="modal-header flex justify-between items-center p-4">
                    <h2>{props.title || "Modal Title"}</h2>
                    <button
                        className="qwm-close"
                        aria-label="Close"
                        onClick={props.onClose}
                    >
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

                <div className="modal-body p-4">
                    {props.children}
                </div>

                {props.footer && (
                    <div className="btn-container p-4 flex justify-end space-x-2">
                        {props.footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
}
