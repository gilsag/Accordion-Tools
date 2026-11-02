import type { DiagramButton, SequenceArrowStyle } from "../../types";
import type { SequenceStepWithButton } from "../../tools/sequenceTools";
import { makeSequenceArrowPath } from "../../tools/sequenceTools";

type DiagramConnectionsProps = {
  showScaleFinderArrows: boolean;
  scaleFinderButtons: DiagramButton[];
  chordFinderActive: boolean;
  chordFinderButtons: DiagramButton[];
  showSequenceArrows: boolean;
  sequenceStepsWithButtons: SequenceStepWithButton[];
  buttonSize: number;
  scaleFinderArrowStyle: SequenceArrowStyle;
  sequenceArrowStyle: SequenceArrowStyle;
  finderArrowheadMarkerId: string;
  sequenceArrowheadMarkerId: string;
};

/** SVG paths follow actual button geometry, without changing any physical
 * button IDs or inferring a sounding event from drawn connections. */
export function DiagramConnections({
  showScaleFinderArrows, scaleFinderButtons, chordFinderActive,
  chordFinderButtons, showSequenceArrows, sequenceStepsWithButtons,
  buttonSize, scaleFinderArrowStyle, sequenceArrowStyle,
  finderArrowheadMarkerId, sequenceArrowheadMarkerId,
}: DiagramConnectionsProps) {
  return <>
            {showScaleFinderArrows &&
              scaleFinderButtons.length > 1 &&
              scaleFinderButtons.slice(0, -1).map((fromButton, index) => {
                const toButton = scaleFinderButtons[index + 1];

                return (
                  <path
                    key={`scale-finder-${fromButton.id}-${toButton.id}-${index}`}
                    d={makeSequenceArrowPath(
                      fromButton,
                      toButton,
                      index,
                      buttonSize,
                      scaleFinderArrowStyle,
                    )}
                    className="finder-arrow"
                    markerEnd={`url(#${finderArrowheadMarkerId})`}
                  />
                );
              })}

            {chordFinderActive &&
              chordFinderButtons.length > 1 &&
              chordFinderButtons.slice(0, -1).map((fromButton, index) => {
                const toButton = chordFinderButtons[index + 1];

                return (
                  <path
                    key={`chord-finder-${fromButton.id}-${toButton.id}-${index}`}
                    d={makeSequenceArrowPath(
                      fromButton,
                      toButton,
                      index,
                      buttonSize,
                      "straight",
                    )}
                    className="finder-arrow"
                    markerEnd={`url(#${finderArrowheadMarkerId})`}
                  />
                );
              })}

            {showSequenceArrows &&
              sequenceStepsWithButtons.slice(0, -1).map((fromStep, index) => {
                const toStep = sequenceStepsWithButtons[index + 1];

                return (
                  <path
                    key={`${fromStep.id}-${toStep.id}-${fromStep.step}-${toStep.step}`}
                    d={makeSequenceArrowPath(
                      fromStep.button,
                      toStep.button,
                      index,
                      buttonSize,
                      sequenceArrowStyle,
                    )}
                    className="sequence-arrow"
                    markerEnd={`url(#${sequenceArrowheadMarkerId})`}
                  />
                );
              })}
  </>;
}
