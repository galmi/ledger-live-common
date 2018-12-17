// @flow
import { from, of, empty, concat } from "rxjs";
import { concatMap, delay } from "rxjs/operators";

import { CantOpenDevice } from "../errors";
import type { FinalFirmware } from "../types/manager";
import { withDevicePolling } from "../hw/deviceAccess";
import getDeviceInfo from "../hw/getDeviceInfo";
import flash from "../hw/flash";
import installFinalFirmware from "../hw/installFinalFirmware";

const wait2s = of({ type: "wait" }).pipe(delay(2000));

export default (deviceId: string, finalFirmware: FinalFirmware) => {
  const withDeviceInfo = withDevicePolling(deviceId)(
    transport => from(getDeviceInfo(transport)),
    () => true // accept all errors. we're waiting forever condition that make getDeviceInfo work
  );

  const withDeviceInstall = install =>
    withDevicePolling(deviceId)(
      install,
      e => e instanceof CantOpenDevice // this can happen if withDevicePolling was still seeing the device but it was then interrupted by a device reboot
    );

  const bootloaderLoop = withDeviceInfo.pipe(
    concatMap(
      deviceInfo =>
        !deviceInfo.isBootloader
          ? empty()
          : concat(
              of({ type: "deviceInfo", deviceInfo }),
              withDeviceInstall(flash(finalFirmware)),
              wait2s,
              bootloaderLoop
            )
    )
  );

  const osuLoop = withDeviceInfo.pipe(
    concatMap(
      deviceInfo =>
        !deviceInfo.isOSU
          ? empty()
          : concat(
              of({ type: "deviceInfo", deviceInfo }),
              withDeviceInstall(installFinalFirmware),
              wait2s,
              osuLoop
            )
    )
  );

  return concat(bootloaderLoop, osuLoop);
};
