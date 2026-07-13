import { useMemo, useState } from "react";
import { HelpCircle } from "lucide-react";
import { Panel } from "reactflow";
import { shortcuts } from "../../constants/shortcuts";
import Modal from "./Modal";

const KEY_SPLIT_REGEX = /\s*\+\s*/;

const renderKeyTokens = (combo: string) => {
  const tokens = combo.split(KEY_SPLIT_REGEX);

  return tokens.map((token, index) => (
    <span key={`${combo}-${token}-${index}`} className="inline-flex items-center">
      <kbd className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs font-semibold text-gray-700 shadow-sm">
        {token}
      </kbd>
      {index < tokens.length - 1 && (
        <span className="px-1 text-xs text-gray-500">+</span>
      )}
    </span>
  ));
};

export default function ShortcutHelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  const groupedShortcuts = useMemo(() => shortcuts, []);

  return (
    <>
      <Panel position="top-right" className="!m-4">
        <button
          type="button"
          aria-label="Open shortcut help"
          onClick={() => setIsOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 shadow-md transition hover:bg-gray-50 hover:text-gray-900"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </Panel>

      <Modal
        title="Keyboard Shortcuts"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        footer={
          <div className="flex justify-end space-x-2">
            <button
              className="btn btn-secondary"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            {groupedShortcuts.map((category) => (
              <section
                key={category.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-4"
              >
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
                  {category.category}
                </h3>

                <ul className="space-y-3">
                  {category.shortcuts.map((shortcut) => (
                    <li
                      key={shortcut.id}
                      className="flex items-start justify-between gap-3"
                    >
                      <span className="text-sm text-gray-800">
                        {shortcut.description}
                      </span>

                      <span className="shrink-0 rounded-md border border-gray-200 bg-gray-100 px-2 py-1">
                        {shortcut.keys
                          .split("/")
                          .map((variant, index, variants) => (
                            <span
                              key={`${shortcut.id}-${variant.trim()}-${index}`}
                              className="inline-flex items-center"
                            >
                              {renderKeyTokens(variant.trim())}

                              {index < variants.length - 1 && (
                                <span className="px-2 text-xs text-gray-500">
                                  /
                                </span>
                              )}
                            </span>
                          ))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </Modal>
    </>
  );
}