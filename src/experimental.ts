// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import assert from 'node:assert'
import { $, within } from './core.js'
import { sleep } from './goods.js'
import { Duration, parseDuration } from './util.js'

export async function retry<T>(count: number, callback: () => T): Promise<T>
export async function retry<T>(
  count: number,
  duration: Duration,
  callback: () => T
): Promise<T>
export async function retry<T>(
  count: number,
  a: Duration | (() => T),
  b?: () => T
): Promise<T> {
  const total = count
  let callback: () => T
  let delay = 0
  if (typeof a == 'function') {
    callback = a
  } else {
    delay = parseDuration(a)
    assert(b)
    callback = b
  }
  let lastErr: unknown
  while (count-- > 0) {
    try {
      return await callback()
    } catch (err) {
      $.log({
        kind: 'retry',
        error:
          chalk.bgRed.white(' FAIL ') +
          ` Attempt: ${total - count}/${total}` +
          (delay > 0 ? `; next in ${delay}ms` : ''),
      })
      lastErr = err
      if (count == 0) break
      if (delay) await sleep(delay)
    }
  }
  throw lastErr
}

export async function spinner<T>(callback: () => T): Promise<T>
export async function spinner<T>(title: string, callback: () => T): Promise<T>
export async function spinner<T>(
  title: string | (() => T),
  callback?: () => T
): Promise<T> {
  if (typeof title == 'function') {
    callback = title
    title = ''
  }
  let i = 0
  const spin = () =>
    process.stderr.write(`  ${'⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'[i++ % 10]} ${title}\r`)
  return within(async () => {
    $.verbose = false
    const id = setInterval(spin, 100)
    const result = await callback!()
    clearInterval(id)
    return result
  })
}
